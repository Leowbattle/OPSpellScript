"use strict";

// OPSpellScript
// By Leo Battle April 2019

// Don't change this (unless you know what you are doing)
// If you make this too low you could get IP banned for D-DOSing
// If this happens, change your IP by disconnecting and reconnecting
// to the internet.
const WAIT_TIME = 500;

function log(msg) {
	console.log(`OPSpellScript - ${msg}`);
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function getFile(url) {
	return new Promise(function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.responseType = "text";
		xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.responseText);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
	});
}

let numLeftLabel;

let minSlider;
let maxSlider;

window.onload = function() {
	// let url = new URL(window.location.href);
	// url.searchParams.append("tradeable", );

	let searchButton = document.createElement("button");
	searchButton.textContent = "pReSs Me fOr $$$";
	searchButton.onclick = doSearch;
	document.getElementsByClassName("premium-search-form")[0].appendChild(searchButton);
	
	numLeftLabel = document.createElement("p");
	numLeftLabel.textContent = "0";
	document.getElementsByClassName("premium-search-form")[0].appendChild(numLeftLabel);

	minSlider = document.createElement("input");
	minSlider.type = "range";
	minSlider.min = 0;
	minSlider.max = new URL(window.location.href).searchParams.get("page");
	let minLabel = document.createElement("p");
	document.getElementsByClassName("premium-search-form")[0].appendChild(minLabel);
	minSlider.oninput = function() {
		minLabel.innerHTML = "Minimum page is " + minSlider.value;
	}

	document.getElementsByClassName("premium-search-form")[0].appendChild(minSlider);

	maxSlider = document.createElement("input");
	maxSlider.type = "range";
	maxSlider.min = 0;
	maxSlider.max = new URL(window.location.href).searchParams.get("page");
	let maxLabel = document.createElement("p");
	document.getElementsByClassName("premium-search-form")[0].appendChild(maxLabel);
	maxSlider.oninput = function() {
		maxLabel.innerHTML = "Maximum page is " + maxSlider.value;
	}

	document.getElementsByClassName("premium-search-form")[0].appendChild(maxSlider);
}

async function doSearch() {
	let MIN_PAGE = minSlider.value;
	let MAX_PAGE = maxSlider.value;
	let NUM_PAGES = MAX_PAGE - MIN_PAGE + 1;
	if (NUM_PAGES <= 0) {
		alert("The minimum page must be lower than the maximum page");
		return;
	}
	let numLeft = NUM_PAGES;
	numLeftLabel.textContent = `${numLeft}/${NUM_PAGES}`;

	let thisURL = new URL(window.location.href);
	let item = thisURL.searchParams.get("item");
	let quality = thisURL.searchParams.get("quality");
	let number = thisURL.searchParams.get("low");
	let numberHigh = thisURL.searchParams.get("high");
	log(`Gathering info for ${item}...`);
	let start = Date.now();

	let results = [];

	let parser = new DOMParser();
	for (let i = MAX_PAGE; i >= MIN_PAGE; i--) {
		(async function() {
			let url = (function() {
				let url = new URL("https://backpack.tf/premium/search");
				url.searchParams.append("page", i);
				url.searchParams.append("item", item);
				if (quality != null) {
					// There is no quality filter if it is null
					url.searchParams.append("quality", quality);
				}
				if (thisURL.searchParams.get("numeric") == "level") {
					url.searchParams.append("numeric", "level");
					url.searchParams.append("low", number);
					if (numberHigh != null) {
						url.searchParams.append("comparison", "range");
						url.searchParams.append("high", numberHigh);
					}
				}
				url.searchParams.append("tradable", 1);
				return url.toString();
			})();
			// console.log(url);
			
			let response = await getFile(url);
			let doc = parser.parseFromString(response, "text/html");

			let searchResults = doc.getElementsByClassName("item");
			
			for (let result of searchResults) {
				let spell1 = result.getAttribute("data-spell_1");
				if (spell1 == null) {
					continue;
				}

				let owner = result.parentElement.parentElement.getElementsByClassName("description")[0]
					.getElementsByClassName("btn btn-default btn-xs")[0]
					.getAttribute("href");

				let spell = {
					"spell": spell1,
					"owner": owner,
					"secondSpell": result.getAttribute("data-spell_2"),
					"quality": result.getAttribute("data-quality"),
					"level": result.getAttribute("data-level")
				};
				results.push(spell);
			}

			numLeft--;
			numLeftLabel.textContent = `${numLeft}/${NUM_PAGES}`;
		})();

		await sleep(WAIT_TIME);
	}

	let duration = Date.now() - start;
	log(`Gathered info in ${duration / 1000} seconds`);

	showResults(results, item, NUM_PAGES);
}

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function showResults(spells, item, NUM_PAGES) {
	log("Generating HTML");
	let start = Date.now();

	spells.sort((a, b) => a.spell < b.spell ? -1 : 1);

	let page = `<!DOCTYPE html>
	<html>
		<head><title>Info for ${item}</title></head>
		<script>${copyToClipboard.toString()}</script>
		<body>
			<p>Found ${spells.length} spells for ${item} out of ${NUM_PAGES * 15} items
			${spells.length / (NUM_PAGES * 15) * 100}% had spells</p>
			<button onclick=copyToClipboard(document.documentElement.outerHTML)>Click to copy this page's HTML to clipboard</button><div>`;

	let lastSpell = "";
	for (let spellAndOwner of spells) {
		let spell = spellAndOwner.spell;
		let owner = spellAndOwner.owner;

		page += "<div>";

		if (spell != lastSpell) {
			lastSpell = spell;
			
			page += `</div><div><h1><b>${spell}</b></h1>`;
		}

		// DO
		// genuine haunted strange unique unusual vintage
		// const QUALITIES = [1, 13, 11, 6, 5, 3];
		const QUALITIES = {
			1: ["Genuine", "#4d7455"],
			13: ["Haunted", "#38f3ab"],
			11: ["Strange", "#cf6a32"],
			6: ["Unique", "#ffd700"],
			5: ["Unusual", "#8650ac"],
			3: ["Vintage", "476291"]
		};
		let quality = QUALITIES[spellAndOwner.quality][0];
		let colour = QUALITIES[spellAndOwner.quality][1];

		page += `<span style="color:${colour}">${quality}</span> <a href=https://backpack.tf${owner} target="_blank">A dude with da level ${spellAndOwner.level} spell</a>`;
		if (spellAndOwner.secondSpell) {
			page += `<p style="display:inline"><--- He has two spells o_O (second is <b>${spellAndOwner.secondSpell}</b>)</p><br>`;
		} else {
			page += "<br>";
		}

		page += "</div>";
	}

	page += `</body>
	</html>`

	let duration = Date.now() - start;
	log(`Generated HTML in ${duration / 1000} seconds`);

	let newTab = window.open();
	newTab.document.write(page);
}