<?php

require_once dirname( __DIR__ ) . '/includes/search-algorithm.php';
require_once dirname( __DIR__ ) . '/includes/migration-data.php';

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
	'tags'        => 'baby dining bowl',
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
gedu_test_assert( $title_score > 0, 'accepts a strong title match' );
gedu_test_assert( 0.0 === $body_score, 'rejects a description-only match' );

$false_positive = array(
	'title'       => 'baby educational musical phone toy',
	'sku'         => '',
	'aliases'     => '',
	'tags'        => 'learning toy',
	'attributes'  => 'plastic multicolor',
	'categories'  => 'toys',
	'short'       => 'press the button to play music',
	'description' => 'keep children away from mobile phones',
);
gedu_test_assert( 0.0 === gedu_search_score_record( $false_positive, array( 'dress' ) ), 'does not fuzzy-match dress to press' );
gedu_test_assert( 0.0 === gedu_search_score_record( $false_positive, array( 'mobile' ) ), 'does not qualify from incidental description text' );

$tablet = $false_positive;
$tablet['title'] = 'lcd writing tablet for kids';
gedu_test_assert( 0.0 === gedu_search_score_record( $tablet, array( 'table' ) ), 'does not fuzzy-match table to tablet' );

$feeding_aliases = gedu_search_suggest_aliases( 'Mini Glass Baby Feeding Bottle', 'Feeding & Nursing' );
gedu_test_assert( in_array( 'dudher botol', $feeding_aliases, true ), 'suggests a Banglish product alias' );
gedu_test_assert( in_array( 'দুধের বোতল', $feeding_aliases, true ), 'suggests a Bangla product alias' );

$future_aliases = gedu_search_suggest_aliases( 'Future Kids Activity Product', 'Toys' );
gedu_test_assert( in_array( 'khelna', $future_aliases, true ), 'category rules cover future products' );
gedu_test_assert( in_array( 'খেলনা', $future_aliases, true ), 'future products receive Bangla category vocabulary' );

$merged_aliases = gedu_search_merge_aliases( 'custom phrase, khelna', array( 'khelna', 'খেলনা' ) );
gedu_test_assert( false !== strpos( $merged_aliases, 'custom phrase' ), 'preserves existing custom aliases' );
gedu_test_assert( 1 === substr_count( $merged_aliases, 'khelna' ), 'does not duplicate existing aliases' );
gedu_test_assert( $merged_aliases === gedu_search_merge_aliases( $merged_aliases, array( 'khelna', 'খেলনা' ) ), 'alias migration is idempotent' );

$record['aliases'] = implode( ', ', $feeding_aliases );
gedu_test_assert( gedu_search_score_record( $record, array( 'দুধের বোতল' ) ) > 0, 'Bangla aliases participate in product matching' );

fwrite( STDOUT, "All product search algorithm tests passed.\n" );
