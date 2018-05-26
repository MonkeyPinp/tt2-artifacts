var hero_type = '';
var build = '';
var gold = '';
var active = '';
var splash = '';

function adjustWeights() {
	gtag('event', 'Dark Mode', {
		'event_category': 'Dark Mode',
		'event_action': 'Setting',
		'event_label': ($('#dark').prop('checked') ? 'Dark' : 'Light' )
	});
	if($('#build').val()) {
		gtag('event', 'Build', {
			'event_category': 'Build',
			'event_action': 'Value',
			'event_label': $('#build').val()
		});
	}
	if($('#hero').val()) {
		gtag('event', 'Hero', {
			'event_category': 'Hero',
			'event_action': 'Set',
			'event_label': $('#hero').val()
		});
	}
	if($('#gold').val()) {
		gtag('event', 'Gold', {
			'event_category': 'Gold',
			'event_action': 'Set',
			'event_label': $('#gold').val()
		});
	}
	if($('#active').val()) {
		gtag('event', 'Active', {
			'event_category': 'Active',
			'event_action': 'Set',
			'event_label': $('#active').val()
		});
	}
	build = $('#build').val();
	active = ("online" == $('#active').val() ? true : false);
	splash = (true == $('#wet').prop('checked') ? true: false);
	gold = $('#gold').val();

	switch($('#hero').val()) {
		case 'maya':
		case 'kronus':
		case 'kiki':
		case 'beany':
		case 'ursa':
		case 'wally':
		case 'pharaoh':
		case 'cass':
		case 'lucy':
		case 'jazz':
		case 'mina':
			hero_type = 'spell_ground';
			break;

		case 'zato':
		case 'sophia':
		case 'lance':
		case 'gulbrand':
		case 'rhys':
		case 'cosette':
		case 'jayce':
		case 'boomoh':
		case 'aya':
		case 'yzafa':
			hero_type = 'melee_ground';
			break;

		case 'pingo':
		case 'rosabella':
		case 'davey':
		case 'maddie':
		case 'sawyer':
		case 'saje':
		case 'dex':
		case 'lala':
		case 'miki':
		case 'finn':
			hero_type = 'ranged_ground';
			break;

		case 'maple':
		case 'nohni':
			hero_type = 'melee_flying';
		break;

		case 'kin':
		case 'zolom':
			hero_type = 'ranged_flying';
			break;

		case 'titania':
		case 'damon':
			hero_type = 'spell_flying';
			break;
	}
	$.each(artifacts.data, function(k,v) {
		var results = calculateWeight(k,v.expo);
		artifacts.data[k].rating = results.rating;
		artifacts.data[k].color = results.color;
	});
	adjustBoS();
	artifacts = calculateAll(artifacts, true);
	$.each(skills.data, function(k,v) {
		var results = calculateWeight(k,v.expos.b1);
		skills.data[k].rating1 = results.rating;
		skills.data[k].color = results.color;
		if(-1 != v.type2) {
			results = calculateWeight(k,v.expos.b2);
			skills.data[k].rating2 = results.rating;
			skills.data[k].color = determineColorWinner(skills.data[k].color, results.color);
		}
		if(-1 != v.type3) {
			results = calculateWeight(k,v.expos.b3);
			skills.data[k].rating3 = results.rating;
			skills.data[k].color = determineColorWinner(skills.data[k].color, results.color);
		}
	});
	calculateAllSkills();
	storeData();
}

function determineColorWinner(color1, color2) {
	if('info' == color2 || 'info' == color1) {
		return 'info';
	}
	if('success' == color2 && 'info' != color1) {
		return color2;
	}
	if('warning' == color2 && 'info' != color1 && 'success' != color1) {
		return color2;
	}
	if('secondary' == color2 && 'danger' == color1) {
		return color2;
	}
	return color1;
}

function calculateWeight(k,expo) {
	var results = { 'rating' : 0, 'color' : 'danger' };
	if('bos' == k) {
		results.color = 'info';
	} else if(undefined != expo.sum) {
		switch(expo.sum) {
			case 'pet_dmg':
				results.rating += pets_dmg.all;
				results.rating += pets_dmg.tap * reducts.tap[build];
				results.rating += pets_dmg.hero * reducts.hero[build];
				results.rating += pets_dmg.splash * reducts.splash[build] * (true == splash ? 1 : 0);
				results.color = 'info';
				break;

			case 'pet_gold':
				results.rating += pets_gold * reducts.gold;
				results.color = 'warning';
				break;

			case 'pet_skill_phom':
				results.rating *= 3 * reducts.pet[build];
				if('phom' == gold) {
					results.rating += reducts.gold;
				}
				results.color = determineColor(results.rating);
				break;

			case 'skill':
				results.rating += reducts.hs[build];
				results.rating += reducts.ds[build];
				results.rating += reducts.gold * ('phom' == gold ? .5 : 1);
				results.rating += reducts.fs[build];
				results.rating += reducts.wc[build];
				results.rating += reducts.sc[build];
				results.color = 'info';
				break;

			case 'skill_fairy':
				results.rating += reducts.hs[build];
				results.rating += reducts.ds[build];
				results.rating += reducts.gold * ('phom' == gold ? .5 : 1);
				results.rating += reducts.fs[build];
				results.rating += reducts.wc[build];
				results.rating += reducts.sc[build];
				results.rating *= skills.data.fc.levels[Math.min(skills.data.fc.level + 1, skills.data.fc.max)].bonus;
				results.rating += ('fairy' == gold ? reducts.gold : 0);
				results.color = 'info';
				break;

			case 'skill_mana':
				results.rating += reducts.hs[build];
				results.rating += reducts.ds[build];
				results.rating += reducts.gold * ('phom' == gold ? .5 : 1);
				results.rating += reducts.fs[build];
				results.rating += reducts.wc[build];
				results.rating += reducts.sc[build];
				results.rating *= artifacts.data.op.current_effect;
				results.rating *= (0 < artifacts.data.op.level ? 1 : 0);
				results.color = determineColor(results.rating);
				break;

			case 'skill_gold':
				results.rating += (0 < reducts.hs[build] ? reducts.gold : (0 < artifacts.data.ip.level ? reducts.gold : 0));
				results.rating += (0 < reducts.ds[build] ? reducts.gold : (0 < artifacts.data.gok.level ? reducts.gold : 0));
				results.rating += (0 < reducts.fs[build] ? reducts.gold : (0 < artifacts.data.os.level ? reducts.gold : 0));
				results.rating += (0 < reducts.wc[build] ? reducts.gold : (0 < artifacts.data.tac.level ? reducts.gold : 0));
				results.rating += (0 < reducts.sc[build] ? reducts.gold : (0 < artifacts.data.ho.level ? reducts.gold : 0));
        results.rating = (3 * reducts.gold < results.rating ? 3 * reducts.gold : results.rating);
				results.rating += reducts.gold;
				results.color = 'warning';
				break;

			case 'equip':
				results.rating += reducts.sword[build];
				results.rating += reducts.helmet[build];
				results.rating += reducts.gold;
				results.rating += 1;
				results.rating += reducts.companion[build];
				results.color = 'info';
				break;
		}
	} else if(undefined != expo.flat) {
		switch(expo.flat) {
			case 'gold':
				results.rating = reducts.gold;
				results.color = 'warning';
				break;

			case 'none':
				results.rating = 0;
				results.color = 'danger';
				break;

			case 'gold_phom':
				results.rating = reducts.gold * ('phom' == gold ? .5 : 1);
				results.color = 'warning';
				break;

			case 'inactive_phom':
				if(0 == active) {
					results.rating = 1;
					results.color = 'success';
				} else {
					results.rating = reducts.gold * ('phom' == gold ? 1 : 0);
					results.color = 'warning';
				}
				break;

			case 'dmg':
				results.rating = 1;
				results.color = 'info';
				break;

			case 'hsk':
				if(0 < artifacts.data.hs2.level) {
					results.rating = 1;
					results.color = 'info';
				} else {
					results.rating = 0.5;
					results.color = 'secondary';
				}
				break;

			case 'active':
				if(1 == active) {
					results.rating = 1;
					results.color = 'info';
				} else {
					results.rating = 0;
					results.color = 'danger';
				}
				break;

			case 'inactive':
				if(0 == active) {
					results.rating = 1;
					results.color = 'success';
				} else {
					results.rating = 0;
					results.color = 'danger';
				}
				break;

			case 'inactive_pet':
				if(0 == active) {
					results.rating = reducts.pet[build];
					results.color = determineColor(results.rating);
				}
				break;


			case 'inactive_ship':
				if(0 == active) {
					results.rating = reducts.cs[build];
					results.color = determineColor(results.rating);
				}
				break;

			case 'inactive_clone':
				if(0 == active) {
					results.rating = reducts.sc[build];
					results.color = determineColor(results.rating);
				}
				break;
		}
	} else if(undefined != expo.reduct) {
		if('splash' == expo.reduct && false == splash) {
			results.rating = 0;
		} else {
			results.rating = reducts[expo.reduct][build];
		}
		results.color = determineColor(results.rating);
	} else if(undefined != expo.hero_type) {
		if(-1 == hero_type.indexOf(expo.hero_type)) {
			results.rating = 0;
		} else {
			results.rating = reducts.hero[build];
		}
		results.color = determineColor(results.rating);
	} else if(undefined != expo.gold) {
		$.each(expo.gold, function(k2,v2) {
			if(gold == v2) {
				results.rating = reducts.gold;
				return false;
			} else if('partial_splash' == v2) {
				results.rating = reducts.splash[build] * reducts.gold * .5;
				return false;
			} else if('splash' == v2) {
				results.rating = reducts.splash[build] * reducts.gold;
				return false;
			} else if('partial_inactive' == v2) {
				if(!active) {
					results.rating = reducts.gold * .5;
					return false;
				}
			} else if('inactive' == v2) {
				if(!active) {
					results.rating = reducts.gold;
					return false;
				}
			} else if('active' == v2) {
				if(active) {
					results.rating = reducts.gold;
					return false;
				}
			}
		});
		results.color = determineColor(results.rating);
	}
	return results;
}

function determineColor(value) {
	if(reducts.gold == value) {
		return 'warning';
	} else if(1 == value) {
		return 'success';
	} else if(1 < value) {
		return 'info';
	} else if(0 == value) {
		return 'danger';
	} else {
		return 'secondary';
	}
}
