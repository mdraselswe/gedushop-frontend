<?php

require_once dirname( __DIR__ ) . '/includes/search-algorithm.php';

function gedu_test_assert( $condition, $message ) {
	if ( ! $condition ) {
		fwrite( STDERR, "FAIL: {$message}\n" );
		exit( 1 );
	}
}

$record = array(
	'title'       => 'silicone suction feeding set',
	'sku'         => 'feed-100',
	'aliases'     => 'weaning kit',
	'tags'        => 'baby dining',
	'attributes'  => 'food grade silicone',
	'categories'  => 'feeding nursing',
	'short'       => 'plate bowl spoon and cup',
	'description' => 'complete set for first foods',
);

$groups = gedu_search_parse_synonyms( "feeding set, baby plate, খাবার সেট, khabar set\nstroller, pram, baby cart" );

gedu_test_assert( 'baby plate' === gedu_search_normalize( '  Baby-Plate! ' ), 'normalizes punctuation and case' );
gedu_test_assert( in_array( 'feeding set', gedu_search_query_variants( 'baby plate', $groups ), true ), 'expands phrase synonyms' );
gedu_test_assert( gedu_search_score_record( $record, gedu_search_query_variants( 'baby plate', $groups ) ) > 0, 'finds a synonym absent from the product' );
gedu_test_assert( gedu_search_score_record( $record, array( 'sillicone' ) ) > 0, 'tolerates a small English typo' );
gedu_test_assert( gedu_search_score_record( $record, array( 'bowls' ) ) > 0, 'matches common singular and plural forms' );
gedu_test_assert( 0.0 === gedu_search_score_record( $record, array( 'stroller' ) ), 'does not return an unrelated product' );

$title_score = gedu_search_score_record( $record, array( 'feeding set' ) );
$body_score  = gedu_search_score_record( $record, array( 'first foods' ) );
gedu_test_assert( $title_score > $body_score, 'ranks title matches above description-only matches' );

fwrite( STDOUT, "All product search algorithm tests passed.\n" );
