<?php
/**
 * Pure search helpers. This file deliberately has no WordPress dependency so
 * the ranking rules can be exercised from the command line as well as in WP.
 */

if ( ! function_exists( 'gedu_search_normalize' ) ) {
	function gedu_search_normalize( $value ) {
		$value = html_entity_decode( strip_tags( (string) $value ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
		if ( function_exists( 'remove_accents' ) ) {
			$value = remove_accents( $value );
		}
		$value = function_exists( 'mb_strtolower' ) ? mb_strtolower( $value, 'UTF-8' ) : strtolower( $value );
		$value = strtr(
			$value,
			array(
				'০' => '0', '১' => '1', '২' => '2', '৩' => '3', '৪' => '4',
				'৫' => '5', '৬' => '6', '৭' => '7', '৮' => '8', '৯' => '9',
				'&' => ' and ',
			)
		);
		$normalized = preg_replace( '/[^\p{L}\p{N}]+/u', ' ', $value );
		if ( null === $normalized ) {
			$normalized = preg_replace( '/[^a-z0-9]+/', ' ', $value );
		}
		return trim( preg_replace( '/\s+/u', ' ', (string) $normalized ) );
	}
}

if ( ! function_exists( 'gedu_search_tokens' ) ) {
	function gedu_search_tokens( $value ) {
		$value = gedu_search_normalize( $value );
		return '' === $value ? array() : array_values( array_unique( explode( ' ', $value ) ) );
	}
}

if ( ! function_exists( 'gedu_search_english_stem' ) ) {
	/** Conservative singularization for matching common catalogue plurals. */
	function gedu_search_english_stem( $token ) {
		if ( ! preg_match( '/^[a-z]+$/', $token ) || strlen( $token ) < 4 ) {
			return $token;
		}
		if ( preg_match( '/ies$/', $token ) && strlen( $token ) > 4 ) {
			return substr( $token, 0, -3 ) . 'y';
		}
		if ( preg_match( '/(sses|xes|zes|ches|shes)$/', $token ) ) {
			return substr( $token, 0, -2 );
		}
		if ( 's' === substr( $token, -1 ) && ! preg_match( '/(ss|us|is)$/', $token ) ) {
			return substr( $token, 0, -1 );
		}
		return $token;
	}
}

if ( ! function_exists( 'gedu_search_parse_synonyms' ) ) {
	/** One comma-separated equivalent group per line. */
	function gedu_search_parse_synonyms( $raw ) {
		$groups = array();
		$lines  = preg_split( '/\R/u', (string) $raw );
		foreach ( $lines as $line ) {
			$line = trim( preg_replace( '/\s+#.*$/u', '', $line ) );
			if ( '' === $line ) {
				continue;
			}
			$terms = array();
			foreach ( explode( ',', $line ) as $term ) {
				$term = gedu_search_normalize( $term );
				if ( '' !== $term ) {
					$terms[] = $term;
				}
			}
			$terms = array_values( array_unique( $terms ) );
			if ( count( $terms ) > 1 ) {
				$groups[] = $terms;
			}
		}
		return $groups;
	}
}

if ( ! function_exists( 'gedu_search_query_variants' ) ) {
	/**
	 * Expand exact words and phrases through the synonym groups. Expansion is
	 * capped so a badly configured dictionary cannot create exponential work.
	 */
	function gedu_search_query_variants( $query, $groups, $limit = 48 ) {
		$query    = gedu_search_normalize( $query );
		$variants = '' === $query ? array() : array( $query );
		foreach ( $groups as $group ) {
			$snapshot = $variants;
			foreach ( $snapshot as $variant ) {
				$padded = ' ' . $variant . ' ';
				foreach ( $group as $term ) {
					$needle = ' ' . $term . ' ';
					if ( false === strpos( $padded, $needle ) ) {
						continue;
					}
					foreach ( $group as $replacement ) {
						$expanded = gedu_search_normalize( str_replace( $needle, ' ' . $replacement . ' ', $padded ) );
						if ( '' !== $expanded && ! in_array( $expanded, $variants, true ) ) {
							$variants[] = $expanded;
							if ( count( $variants ) >= $limit ) {
								return $variants;
							}
						}
					}
				}
			}
		}
		return $variants;
	}
}

if ( ! function_exists( 'gedu_search_field_score' ) ) {
	function gedu_search_field_score( $query, $field, $weight ) {
		$query = gedu_search_normalize( $query );
		$field = gedu_search_normalize( $field );
		if ( '' === $query || '' === $field ) {
			return 0.0;
		}
		if ( $field === $query ) {
			return $weight * 1.5;
		}
		if ( false !== strpos( ' ' . $field . ' ', ' ' . $query . ' ' ) ) {
			return $weight * 1.15;
		}

		$query_tokens = gedu_search_tokens( $query );
		$field_tokens = gedu_search_tokens( $field );
		if ( empty( $query_tokens ) || empty( $field_tokens ) ) {
			return 0.0;
		}

		$all_exact = true;
		foreach ( $query_tokens as $token ) {
			$matched = false;
			foreach ( $field_tokens as $candidate ) {
				if ( $token === $candidate || gedu_search_english_stem( $token ) === gedu_search_english_stem( $candidate ) ) {
					$matched = true;
					break;
				}
			}
			if ( ! $matched ) {
				$all_exact = false;
				break;
			}
		}
		if ( $all_exact ) {
			return $weight * 0.95;
		}

		$all_prefix = true;
		foreach ( $query_tokens as $token ) {
			$matched = false;
			if ( strlen( $token ) >= 3 ) {
				foreach ( $field_tokens as $candidate ) {
					if ( 0 === strpos( $candidate, $token ) ) {
						$matched = true;
						break;
					}
				}
			}
			if ( ! $matched ) {
				$all_prefix = false;
				break;
			}
		}
		if ( $all_prefix ) {
			return $weight * 0.70;
		}

		// PHP's levenshtein() is byte-based, so fuzzy matching is deliberately
		// limited to ASCII. Bangla/Banglish concept matching comes from synonyms.
		$all_fuzzy = true;
		foreach ( $query_tokens as $token ) {
			$matched = false;
			if ( strlen( $token ) >= 4 && preg_match( '/^[a-z0-9]+$/', $token ) ) {
				$allowed = strlen( $token ) >= 8 ? 2 : 1;
				foreach ( $field_tokens as $candidate ) {
					if ( preg_match( '/^[a-z0-9]+$/', $candidate ) && levenshtein( $token, $candidate ) <= $allowed ) {
						$matched = true;
						break;
					}
				}
			}
			if ( ! $matched ) {
				$all_fuzzy = false;
				break;
			}
		}
		return $all_fuzzy ? $weight * 0.45 : 0.0;
	}
}

if ( ! function_exists( 'gedu_search_score_record' ) ) {
	/**
	 * A product must satisfy a whole query in at least one field or across the
	 * combined record. Strong structured fields outweigh long-form prose.
	 */
	function gedu_search_score_record( $record, $variants ) {
		$weights = array(
			'title'       => 100,
			'sku'         => 120,
			'aliases'     => 90,
			'tags'        => 70,
			'attributes'  => 60,
			'categories'  => 55,
			'short'       => 30,
			'description' => 10,
		);
		$best = 0.0;
		foreach ( $variants as $variant ) {
			$score    = 0.0;
			$combined = array();
			foreach ( $weights as $field => $weight ) {
				$value      = isset( $record[ $field ] ) ? (string) $record[ $field ] : '';
				$combined[] = $value;
				$score     += gedu_search_field_score( $variant, $value, $weight );
			}
			$score += gedu_search_field_score( $variant, implode( ' ', $combined ), 18 );
			$best   = max( $best, $score );
		}
		return $best;
	}
}
