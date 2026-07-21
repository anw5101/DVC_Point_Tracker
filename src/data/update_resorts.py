import json

with open('/Users/anw5101/GitHub/DVC_Point_Tracker/src/data/resorts.json', 'r') as f:
    resorts = json.load(f)

for resort in resorts:
    if resort['id'] == 'saratoga-springs-resort':
        resort['roomTypes'] = [
          { "id": "studio-standard", "name": "Deluxe Studio", "view": "Standard", "sleeps": 4, "bedConfig": "1 Queen, 1 Double Pull-Down" },
          { "id": "studio-preferred", "name": "Deluxe Studio", "view": "Preferred", "sleeps": 4, "bedConfig": "1 Queen, 1 Double Pull-Down" },
          { "id": "1br-standard", "name": "1-Bedroom Villa", "view": "Standard", "sleeps": 5, "bedConfig": "1 King, 1 Queen Pull-Down, 1 Single Pull-Down" },
          { "id": "1br-preferred", "name": "1-Bedroom Villa", "view": "Preferred", "sleeps": 5, "bedConfig": "1 King, 1 Queen Pull-Down, 1 Single Pull-Down" },
          { "id": "2br-standard", "name": "2-Bedroom Villa", "view": "Standard", "sleeps": 9, "bedConfig": "1 King, 1 Queen, 1 Queen Pull-Down, 1 Single Pull-Down" },
          { "id": "2br-preferred", "name": "2-Bedroom Villa", "view": "Preferred", "sleeps": 9, "bedConfig": "1 King, 1 Queen, 1 Queen Pull-Down, 1 Single Pull-Down" },
          { "id": "3br-standard", "name": "3-Bedroom Grand Villa", "view": "Standard", "sleeps": 12, "bedConfig": "1 King, 4 Queens, 1 Queen Sleeper Sofa" },
          { "id": "3br-preferred", "name": "3-Bedroom Grand Villa", "view": "Preferred", "sleeps": 12, "bedConfig": "1 King, 4 Queens, 1 Queen Sleeper Sofa" },
          { "id": "treehouse-villa", "name": "Treehouse Villa", "view": "Standard", "sleeps": 9, "bedConfig": "2 Queens, 1 Bunk Bed, 1 Queen Sleeper Sofa, 1 Twin Sleeper Chair" }
        ]

with open('/Users/anw5101/GitHub/DVC_Point_Tracker/src/data/resorts.json', 'w') as f:
    json.dump(resorts, f, indent=2)
