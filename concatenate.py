import xml.etree.ElementTree as ET
import re
import json

files = []
while True:
    nxt = input(">")
    if nxt == "":
        break
    else:
        with open(nxt.strip(), "r") as file:
            files.append(file.read())

all_items = []

for file in files:
    match = re.search("Info for (.+)</title>", file)
    item = match.group(1)
    file = re.sub("<br>", '', file)
    doc = ET.fromstring(file)

    spell = None
    for div in doc.findall("body/div/div")[1:]:
        new = div.find("h1/b")
        if new != None:
            spell = new.text
        
        secondspell = div.find("p/b")
        if secondspell != None:
            secondspell = secondspell.text

        linkAndLevel = div.find("a")
        if linkAndLevel == None:
            continue
        link = linkAndLevel.attrib["href"]
        level = re.search("([0-9]+)", linkAndLevel.text).group(1)
        
        quality = div.find("span").text

        all_items.append({
            "item": item,
            "spell": spell,
            "secondSpell": secondspell,
            "link": link,
            "level": level,
            "quality": quality
        })

all_items = sorted(all_items, key=lambda k: k["spell"])
print(all_items)

with open("out.html", "w") as file:
    for item in all_items:
        file.write("{} level {} {} spell {} second spell {} <a href={}>link</a><br>".format(item["quality"], item["level"], item["item"], item["spell"], item["secondSpell"], item["link"]))