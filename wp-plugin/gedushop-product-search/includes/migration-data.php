<?php
/**
 * Curated catalogue vocabulary used by both the one-time migration and future
 * product indexing. This file has no WordPress dependency and is testable from
 * the command line.
 */

if ( ! function_exists( 'gedu_search_recommended_synonym_lines' ) ) {
	function gedu_search_recommended_synonym_lines() {
		return array(
			'toy, toys, khelna, খেলনা',
			'educational, learning, shikkhamulok, শিক্ষামূলক, শেখার',
			'feeding bottle, baby bottle, milk bottle, feeder bottle, dudher botol, দুধের বোতল',
			'feeding set, dinner set, baby plate, food set, khabar set, খাবার সেট',
			'feeder, fruit feeder, food feeder, foler feeder, ফলের ফিডার',
			'teether, teething toy, dater khelna, দাঁত ওঠার খেলনা',
			'rattle, baby rattle, jhunjhuni, ঝুনঝুনি',
			'pacifier, soother, dummy, chushni, চুষনি',
			'bib, feeding bib, baby bib, khabar bib, খাবারের বিব',
			'sippy cup, training cup, straw cup, baby cup, বেবি কাপ',
			'potty, toilet trainer, potty trainer, পটি ট্রেইনার',
			'stroller, pram, pushchair, baby cart, baby gari, বাচ্চার গাড়ি',
			'carrier, baby carrier, kangaroo bag, baby bag, বেবি ক্যারিয়ার',
			'cot, crib, baby bed, bassinet, bachchar bichana, বাচ্চার বিছানা',
			'high chair, feeding chair, baby chair, khabar chair, বেবি চেয়ার',
			'diaper bag, mommy bag, mother bag, nappy bag, ডায়াপার ব্যাগ',
			'toothbrush, tooth brush, dental brush, dater brush, দাঁতের ব্রাশ',
			'oral care, mouth care, mukher jotno, মুখের যত্ন',
			'nail trimmer, nail cutter, baby manicure, nokh katar, নখ কাটার',
			'nasal aspirator, nose cleaner, sordi cleaner, নাক পরিষ্কার',
			'bath toy, shower toy, gosoler khelna, গোসলের খেলনা',
			'washcloth, face towel, baby towel, gamcha, বেবি তোয়ালে',
			'building blocks, construction blocks, block set, building set, ব্লক সেট',
			'magnetic tiles, magnetic blocks, magnet blocks, chumbok block, ম্যাগনেটিক ব্লক',
			'puzzle, jigsaw, brain game, dhadha, পাজল, ধাঁধা',
			'flash cards, learning cards, talking cards, shikhar card, শেখার কার্ড',
			'drawing board, writing board, doodle board, lekhar board, লেখার বোর্ড',
			'pretend play, role play, make believe, অভিনয়ের খেলনা',
			'musical toy, music toy, ganer khelna, গানের খেলনা',
			'projector toy, flashlight projector, slide projector, প্রজেক্টর খেলনা',
			'piggy bank, money bank, coin bank, taka jomanor bank, টাকা জমানোর ব্যাংক',
			'water bottle, drinking bottle, kids bottle, panir botol, পানির বোতল',
			'hair clip, hair pin, hair accessory, chuler clip, চুলের ক্লিপ',
			'board game, family game, tabletop game, বোর্ড গেম',
			'combo, bundle, value pack, package, কম্বো, প্যাকেজ',
			'keychain, key ring, bag charm, chabir ring, চাবির রিং',
			'birthday decoration, party decoration, jonmodin decoration, জন্মদিনের সাজসজ্জা',
			'safety wrist link, anti lost strap, child leash, bachchar safety belt, বাচ্চার সেফটি বেল্ট',
		);
	}
}

if ( ! function_exists( 'gedu_search_recommended_synonyms' ) ) {
	function gedu_search_recommended_synonyms() {
		return implode( "\n", gedu_search_recommended_synonym_lines() );
	}
}

if ( ! function_exists( 'gedu_search_alias_rules' ) ) {
	/** Rules are intentionally specific; broad category coverage is added below. */
	function gedu_search_alias_rules() {
		return array(
			array( array( 'atm', 'piggy bank' ), 'money bank, coin bank, savings bank, taka jomanor bank, টাকা জমানোর ব্যাংক' ),
			array( array( 'ukulele', 'guitar' ), 'kids guitar, musical instrument, badyojontro, বাদ্যযন্ত্র, গিটার খেলনা' ),
			array( array( 'oral care', 'oral cleaner', 'gauze swab' ), 'mouth cleaner, baby mouth care, mukher jotno, মুখ পরিষ্কার, শিশুর মুখের যত্ন' ),
			array( array( 'toothbrush', 'tooth brush' ), 'dental brush, baby teeth cleaner, dater brush, দাঁতের ব্রাশ, দাঁত পরিষ্কার' ),
			array( array( 'building block', 'bar block' ), 'construction blocks, block set, building set, ব্লক সেট, বানানোর খেলনা' ),
			array( array( 'magnetic tile', 'magbuild' ), 'magnet blocks, magnetic blocks, chumbok block, ম্যাগনেটিক ব্লক, STEM blocks' ),
			array( array( 'bottle cleaning brush' ), 'feeding bottle cleaner, bottle washing brush, botol porishkar brush, বোতল পরিষ্কারের ব্রাশ' ),
			array( array( 'feeding bottle', 'feeder bottle', 'glass baby feeding bottle' ), 'baby bottle, milk bottle, dudher botol, দুধের বোতল, newborn feeder' ),
			array( array( 'drinking bottle', 'water bottle' ), 'kids bottle, straw bottle, panir botol, পানির বোতল, school bottle' ),
			array( array( 'nail trimmer' ), 'baby nail cutter, manicure kit, nokh katar, নখ কাটার, newborn grooming' ),
			array( array( 'grooming kit' ), 'baby care kit, newborn care set, শিশুর যত্ন সেট, baby hygiene kit' ),
			array( array( 'doctor', 'medical set' ), 'pretend doctor, role play medical kit, daktar khelna, ডাক্তার খেলনা' ),
			array( array( 'feeding bowl', 'food masher', 'suction bowl' ), 'baby bowl, weaning bowl, khabar bati, খাবারের বাটি, baby dinnerware' ),
			array( array( 'feeding plate', 'divided baby plate' ), 'baby dinner set, weaning plate, khabar plate, খাবারের প্লেট, toddler tableware' ),
			array( array( 'feeding set', 'first foods starter' ), 'baby dinner set, weaning kit, khabar set, খাবার সেট, baby tableware' ),
			array( array( 'fruit feeder', 'spoon feeder', 'squeeze feeding' ), 'food feeder, baby weaning feeder, foler feeder, ফলের ফিডার, puree feeder' ),
			array( array( 'pacifier' ), 'soother, dummy, chushni, চুষনি, baby calming nipple' ),
			array( array( 'washcloth', 'towel set' ), 'baby towel, face towel, gosoler kapor, গোসলের কাপড়, newborn wash cloth' ),
			array( array( 'bath rinser' ), 'shampoo rinse cup, baby bath mug, gosoler mug, গোসলের মগ' ),
			array( array( 'candle' ), 'birthday candle, cake candle, jonmodiner mombati, জন্মদিনের মোমবাতি, party candle' ),
			array( array( 'nasal aspirator' ), 'baby nose cleaner, mucus remover, nak porishkar, নাক পরিষ্কার, sordi cleaner' ),
			array( array( 'baby carrier' ), 'kangaroo bag, front carrier, baby carrying bag, বেবি ক্যারিয়ার, baby sling' ),
			array( array( 'hair pin', 'hair clip', 'hair accessories' ), 'girls hair accessory, chuler clip, চুলের ক্লিপ, মেয়েদের হেয়ার ক্লিপ' ),
			array( array( 'jewelry', 'necklace', 'bracelet' ), 'girls jewellery, princess accessories, gohona set, গহনা সেট, মেয়েদের অলংকার' ),
			array( array( 'truck', 'toy car', 'racing car', 'gear bunny' ), 'vehicle toy, gari khelna, গাড়ির খেলনা, kids car, pull back car' ),
			array( array( 'kitchen playset' ), 'pretend kitchen, cooking toy, rannaghor khelna, রান্নাঘরের খেলনা, role play kitchen' ),
			array( array( 'bath toy' ), 'water toy, shower toy, gosoler khelna, গোসলের খেলনা, tub toy' ),
			array( array( 'flash card', 'talking book', 'smart book' ), 'learning cards, vocabulary toy, shikhar boi, শেখার বই, speaking learning toy' ),
			array( array( 'spinning top' ), 'light up top, latim, লাটিম, ঘূর্ণি খেলনা, music top' ),
			array( array( 'knee pad' ), 'crawling protector, baby knee guard, hatur guard, হাঁটুর গার্ড' ),
			array( array( 'football', 'soccer ball' ), 'kids football, outdoor ball, ফুটবল, khelar ball, খেলার বল' ),
			array( array( 'jigsaw', 'puzzle' ), 'brain game, matching puzzle, dhadhar khelna, ধাঁধার খেলনা, problem solving toy' ),
			array( array( 'game console' ), 'handheld video game, retro gaming, game machine, গেম মেশিন' ),
			array( array( 'balloon', 'banner decoration' ), 'birthday decoration, party decor, jonmodiner saj, জন্মদিনের সাজসজ্জা' ),
			array( array( 'writing tablet', 'drawing board', 'whiteboard', 'blackboard', 'message board' ), 'doodle board, writing pad, lekhar board, লেখার বোর্ড, আঁকার বোর্ড' ),
			array( array( 'fishing toy' ), 'magnetic fishing game, mach dhorar khelna, মাছ ধরার খেলনা, fine motor game' ),
			array( array( 'high chair' ), 'baby feeding chair, toddler chair, khabar chair, খাবারের চেয়ার, dining chair' ),
			array( array( 'milk storage' ), 'breastmilk bag, nursing storage bag, buker dudh rakhar bag, বুকের দুধ রাখার ব্যাগ' ),
			array( array( 'nest bed', 'mosquito net' ), 'baby bed, newborn bedding, mosari bichana, মশারিসহ বিছানা, infant nest' ),
			array( array( 'piano', 'electronic organ' ), 'musical keyboard toy, music learning toy, piano khelna, পিয়ানো খেলনা' ),
			array( array( 'bed bell mobile', 'mobile toy for crib' ), 'crib mobile, cot mobile, hanging baby toy, ঝুলন্ত বেবি খেলনা, ghum parani khelna' ),
			array( array( 'telephone', 'phone toy', 'musical phone' ), 'pretend phone, mobile toy, phone khelna, ফোন খেলনা, learning phone' ),
			array( array( 'silicone teat', 'response teat' ), 'feeding nipple, bottle nipple, dudher botoler nipple, বোতলের নিপল' ),
			array( array( 'bunny', 'rabbit' ), 'khorgosh khelna, খরগোশের খেলনা, hopping bunny, rabbit toy' ),
			array( array( 'teether', 'teething ring' ), 'gum soother, dater khelna, দাঁত ওঠার খেলনা, baby chew toy' ),
			array( array( 'rattle' ), 'jhunjhuni, ঝুনঝুনি, baby sound toy, newborn sensory toy' ),
			array( array( 'robot', 'airplane' ), 'transformer toy, plane toy, উড়োজাহাজ খেলনা, robot khelna, রোবট খেলনা' ),
			array( array( 'figure', 'spider man', 'super heroes', 'avengers' ), 'action figure, superhero toy, সুপারহিরো খেলনা, character toy' ),
			array( array( 'tic tac toe', 'monopoly', 'board game' ), 'family game, strategy game, বোর্ড গেম, ঘরোয়া খেলা, tabletop game' ),
			array( array( 'bib' ), 'feeding bib, food catcher, khabar bib, খাবারের বিব, waterproof bib' ),
			array( array( 'soft gun' ), 'foam bullet gun, target shooting toy, বন্দুক খেলনা, nerf style gun' ),
			array( array( 'parrot' ), 'bird toy, pakhi khelna, পাখির খেলনা, musical parrot' ),
			array( array( 'wind up' ), 'clockwork toy, chabi deya khelna, চাবি দেওয়া খেলনা, walking animal toy' ),
			array( array( 'beach bucket', 'play sand', 'kinetic' ), 'sand play set, balur khelna, বালুর খেলনা, sensory sand' ),
			array( array( 'flashlight projector' ), 'slide projector, torch projector, chobi dekhar torch, ছবি দেখার টর্চ' ),
			array( array( 'shower cap' ), 'baby bath visor, shampoo cap, gosoler cap, গোসলের ক্যাপ, eye protection cap' ),
			array( array( 'earpick' ), 'ear cleaner, ear wax tool, kan porishkar, কান পরিষ্কারের যন্ত্র' ),
			array( array( 'number', 'alphabet', 'spelling', 'copybook', 'activity book' ), 'preschool learning, handwriting practice, porar khelna, পড়ার খেলনা, early education' ),
			array( array( 'science', 'electric circuit', 'math scale', 'stem' ), 'STEM learning, science experiment, biggan khelna, বিজ্ঞান খেলনা, educational kit' ),
			array( array( 'maze' ), 'logic maze, fine motor board, golokdhadha, গোলকধাঁধা, brain development toy' ),
			array( array( 'keychain' ), 'key ring, bag charm, chabir ring, চাবির রিং, backpack charm' ),
			array( array( 'hand fan' ), 'folding fan, hath pakha, হাতপাখা, portable fan' ),
			array( array( 'dart board' ), 'target game, sticky dart, লক্ষ্যভেদের খেলা, indoor sports game' ),
			array( array( 'number train' ), 'wooden train, counting toy, সংখ্যা শেখার ট্রেন, learning train' ),
			array( array( 'combo', 'starter set' ), 'bundle, value pack, package deal, কম্বো অফার, সাশ্রয়ী প্যাকেজ' ),
			array( array( 'wrist link', 'anti lost' ), 'child safety strap, toddler leash, bachchar safety belt, বাচ্চার সেফটি বেল্ট' ),
			array( array( 'snake twist' ), 'magic snake puzzle, twist puzzle, স্নেক পাজল, shape changing toy' ),
			array( array( 'tummy time', 'water play mat' ), 'baby activity mat, infant play mat, tummy mat, বেবি প্লে ম্যাট' ),
			array( array( 'sippy cup' ), 'training cup, straw cup, baby drinking cup, বেবি কাপ, toddler cup' ),
			array( array( 'bath sponge' ), 'baby body sponge, gosoler sponge, গোসলের স্পঞ্জ, newborn bath pad' ),
			array( array( 'squishy', 'stress relief' ), 'sensory toy, squeeze toy, stress ball, স্কুইশি খেলনা, fidget toy' ),
			array( array( 'fidget', 'pop tube' ), 'sensory toy, stress toy, pop toy, ফিজেট খেলনা, busy hands toy' ),
		);
	}
}

if ( ! function_exists( 'gedu_search_category_aliases' ) ) {
	function gedu_search_category_aliases() {
		return array(
			'toys'                         => 'kids toy, children toy, khelna, খেলনা',
			'education'                    => 'learning toy, educational item, shikhar khelna, শেখার খেলনা, শিক্ষামূলক',
			'feeding and nursing'          => 'baby feeding, newborn feeding, shishur khabar, শিশুর খাবার, বেবি ফিডিং',
			'health and safety'            => 'baby care, child safety, shishur jotno, শিশুর যত্ন, নিরাপত্তা',
			'skincare and bath'            => 'baby bath, baby skincare, gosoler jinis, গোসলের সামগ্রী, শিশুর ত্বকের যত্ন',
			'nursery and bedding'          => 'baby nursery, baby bedding, bachchar bichana, বাচ্চার বিছানা, newborn essentials',
			'party'                        => 'party supplies, birthday item, jonmodiner jinis, জন্মদিনের সামগ্রী',
			'accessories and jewelry'      => 'kids accessories, girls accessories, bachchar accessory, বাচ্চাদের অ্যাক্সেসরিজ',
			'sports'                       => 'kids sports, outdoor game, khelar samogri, খেলার সামগ্রী',
			'gift box'                     => 'kids gift, birthday gift, upohar, উপহার, gift item',
			'combo offers'                 => 'combo pack, bundle offer, value pack, কম্বো অফার, সাশ্রয়ী প্যাক',
			'baby clothing'                => 'baby clothes, newborn clothing, shishur poshak, শিশুর পোশাক',
			'school and stationery supplies' => 'school supplies, stationery, school item, স্কুলের সামগ্রী',
		);
	}
}

if ( ! function_exists( 'gedu_search_suggest_aliases' ) ) {
	function gedu_search_suggest_aliases( $title, $categories = '' ) {
		$haystack = ' ' . gedu_search_normalize( $title . ' ' . $categories ) . ' ';
		$aliases  = array();

		foreach ( gedu_search_alias_rules() as $rule ) {
			foreach ( $rule[0] as $needle ) {
				if ( false !== strpos( $haystack, gedu_search_normalize( $needle ) ) ) {
					$aliases = array_merge( $aliases, array_map( 'trim', explode( ',', $rule[1] ) ) );
					break;
				}
			}
		}

		$normalized_categories = gedu_search_normalize( $categories );
		foreach ( gedu_search_category_aliases() as $category => $category_aliases ) {
			if ( false !== strpos( ' ' . $normalized_categories . ' ', ' ' . $category . ' ' ) ) {
				$aliases = array_merge( $aliases, array_map( 'trim', explode( ',', $category_aliases ) ) );
			}
		}

		$seen   = array();
		$result = array();
		foreach ( $aliases as $alias ) {
			$key = gedu_search_normalize( $alias );
			if ( '' !== $key && ! isset( $seen[ $key ] ) ) {
				$seen[ $key ] = true;
				$result[]     = $alias;
			}
		}
		return $result;
	}
}

if ( ! function_exists( 'gedu_search_merge_aliases' ) ) {
	function gedu_search_merge_aliases( $existing, $suggested ) {
		$values = array_merge( preg_split( '/[,\r\n]+/u', (string) $existing ), (array) $suggested );
		$seen   = array();
		$result = array();
		foreach ( $values as $value ) {
			$value = trim( (string) $value );
			$key   = gedu_search_normalize( $value );
			if ( '' !== $key && ! isset( $seen[ $key ] ) ) {
				$seen[ $key ] = true;
				$result[]     = $value;
			}
		}
		return implode( ', ', $result );
	}
}

if ( ! function_exists( 'gedu_search_merge_synonym_text' ) ) {
	function gedu_search_merge_synonym_text( $existing ) {
		$lines = preg_split( '/\R/u', trim( (string) $existing ) );
		$seen  = array();
		foreach ( $lines as $line ) {
			$key = gedu_search_normalize( $line );
			if ( '' !== $key ) {
				$seen[ $key ] = true;
			}
		}
		foreach ( gedu_search_recommended_synonym_lines() as $line ) {
			$key = gedu_search_normalize( $line );
			if ( ! isset( $seen[ $key ] ) ) {
				$lines[]      = $line;
				$seen[ $key ] = true;
			}
		}
		return trim( implode( "\n", array_filter( array_map( 'trim', $lines ) ) ) );
	}
}
