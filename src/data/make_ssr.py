import json
data = {
  "resortId": "saratoga-springs-resort",
  "year": 2025,
  "travelPeriods": [
    {
      "id": "period-1",
      "name": "Travel Period 1",
      "dateRanges": [
        { "start": "2025-09-01", "end": "2025-09-30" }
      ]
    },
    {
      "id": "period-2",
      "name": "Travel Period 2",
      "dateRanges": [
        { "start": "2025-01-01", "end": "2025-01-31" },
        { "start": "2025-05-01", "end": "2025-05-14" }
      ]
    },
    {
      "id": "period-3",
      "name": "Travel Period 3",
      "dateRanges": [
        { "start": "2025-05-15", "end": "2025-06-10" },
        { "start": "2025-12-01", "end": "2025-12-23" }
      ]
    },
    {
      "id": "period-4",
      "name": "Travel Period 4",
      "dateRanges": [
        { "start": "2025-02-01", "end": "2025-02-15" },
        { "start": "2025-06-11", "end": "2025-08-31" }
      ]
    },
    {
      "id": "period-5",
      "name": "Travel Period 5",
      "dateRanges": [
        { "start": "2025-10-01", "end": "2025-11-25" },
        { "start": "2025-11-29", "end": "2025-11-30" }
      ]
    },
    {
      "id": "period-6",
      "name": "Travel Period 6",
      "dateRanges": [
        { "start": "2025-02-16", "end": "2025-04-12" },
        { "start": "2025-04-21", "end": "2025-04-30" },
        { "start": "2025-11-26", "end": "2025-11-28" }
      ]
    },
    {
      "id": "period-7",
      "name": "Travel Period 7",
      "dateRanges": [
        { "start": "2025-04-13", "end": "2025-04-20" },
        { "start": "2025-12-24", "end": "2025-12-31" }
      ]
    }
  ],
  "pointChart": [
    {
      "roomTypeId": "studio-standard",
      "seasons": {
        "period-1": { "weekday": 9, "weekend": 14 },
        "period-2": { "weekday": 12, "weekend": 15 },
        "period-3": { "weekday": 13, "weekend": 15 },
        "period-4": { "weekday": 14, "weekend": 16 },
        "period-5": { "weekday": 14, "weekend": 17 },
        "period-6": { "weekday": 15, "weekend": 18 },
        "period-7": { "weekday": 21, "weekend": 25 }
      }
    },
    {
      "roomTypeId": "studio-preferred",
      "seasons": {
        "period-1": { "weekday": 11, "weekend": 16 },
        "period-2": { "weekday": 13, "weekend": 17 },
        "period-3": { "weekday": 15, "weekend": 18 },
        "period-4": { "weekday": 15, "weekend": 19 },
        "period-5": { "weekday": 16, "weekend": 19 },
        "period-6": { "weekday": 17, "weekend": 21 },
        "period-7": { "weekday": 23, "weekend": 28 }
      }
    },
    {
      "roomTypeId": "1br-standard",
      "seasons": {
        "period-1": { "weekday": 21, "weekend": 27 },
        "period-2": { "weekday": 24, "weekend": 29 },
        "period-3": { "weekday": 26, "weekend": 31 },
        "period-4": { "weekday": 28, "weekend": 33 },
        "period-5": { "weekday": 30, "weekend": 34 },
        "period-6": { "weekday": 32, "weekend": 36 },
        "period-7": { "weekday": 43, "weekend": 47 }
      }
    },
    {
      "roomTypeId": "1br-preferred",
      "seasons": {
        "period-1": { "weekday": 24, "weekend": 30 },
        "period-2": { "weekday": 28, "weekend": 34 },
        "period-3": { "weekday": 30, "weekend": 35 },
        "period-4": { "weekday": 32, "weekend": 37 },
        "period-5": { "weekday": 34, "weekend": 39 },
        "period-6": { "weekday": 38, "weekend": 42 },
        "period-7": { "weekday": 49, "weekend": 53 }
      }
    },
    {
      "roomTypeId": "2br-standard",
      "seasons": {
        "period-1": { "weekday": 27, "weekend": 34 },
        "period-2": { "weekday": 32, "weekend": 36 },
        "period-3": { "weekday": 35, "weekend": 39 },
        "period-4": { "weekday": 36, "weekend": 39 },
        "period-5": { "weekday": 37, "weekend": 45 },
        "period-6": { "weekday": 41, "weekend": 47 },
        "period-7": { "weekday": 56, "weekend": 63 }
      }
    },
    {
      "roomTypeId": "2br-preferred",
      "seasons": {
        "period-1": { "weekday": 35, "weekend": 39 },
        "period-2": { "weekday": 38, "weekend": 42 },
        "period-3": { "weekday": 39, "weekend": 45 },
        "period-4": { "weekday": 41, "weekend": 50 },
        "period-5": { "weekday": 46, "weekend": 54 },
        "period-6": { "weekday": 49, "weekend": 59 },
        "period-7": { "weekday": 67, "weekend": 75 }
      }
    },
    {
      "roomTypeId": "3br-standard",
      "seasons": {
        "period-1": { "weekday": 63, "weekend": 72 },
        "period-2": { "weekday": 68, "weekend": 78 },
        "period-3": { "weekday": 74, "weekend": 83 },
        "period-4": { "weekday": 77, "weekend": 86 },
        "period-5": { "weekday": 86, "weekend": 97 },
        "period-6": { "weekday": 93, "weekend": 107 },
        "period-7": { "weekday": 113, "weekend": 127 }
      }
    },
    {
      "roomTypeId": "3br-preferred",
      "seasons": {
        "period-1": { "weekday": 74, "weekend": 84 },
        "period-2": { "weekday": 76, "weekend": 89 },
        "period-3": { "weekday": 82, "weekend": 94 },
        "period-4": { "weekday": 87, "weekend": 98 },
        "period-5": { "weekday": 98, "weekend": 112 },
        "period-6": { "weekday": 108, "weekend": 125 },
        "period-7": { "weekday": 131, "weekend": 139 }
      }
    },
    {
      "roomTypeId": "treehouse-villa",
      "seasons": {
        "period-1": { "weekday": 38, "weekend": 43 },
        "period-2": { "weekday": 41, "weekend": 45 },
        "period-3": { "weekday": 43, "weekend": 48 },
        "period-4": { "weekday": 44, "weekend": 51 },
        "period-5": { "weekday": 47, "weekend": 52 },
        "period-6": { "weekday": 51, "weekend": 58 },
        "period-7": { "weekday": 66, "weekend": 76 }
      }
    }
  ]
}

with open('/Users/anw5101/GitHub/DVC_Point_Tracker/src/data/points/saratoga-springs-resort-2025.json', 'w') as f:
    json.dump(data, f, indent=2)
