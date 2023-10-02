# Tracking app

No tracking app is perfect for me so I made my own!

### Goal types:

1) TIMELY: Track times/amounts per day/week you do something (eg, exercise, water)
2) INSTANCE: Track how long since something was done (eg, hair washing)
3) TOGGLE: Track something that can be true or false over a period of time (eg, period tracking)

### Spec: 
Two tables will be stored: one with a list of specs for each kind of tracking, and one for logging all log events of all kinds.

List of tracking configs where each has the following options:
```
{  
  name = string; // primary key
  type = int; // 1, 2, or 3 as laid out here
  priority? = int; // For ordering in the UI. Higher # = displayed first in the list
  icon? = string; // An emoji to use to represent this
  color? = string; // Used for UI display  
  parent? = string; // To indicate sub-tasks

  // For tracking type 1:
  refreshCycle? = string; // D/W/M for daily/weekly/monthly tracking
  amountVaries? = int; // eg, yes for water, no for exercise
  goal? = int;

  // For tracking type 3:
  expectedCycleLenth? = int;
  expectedInstanceLength? = int;
}
```

Logs are a list of entries with the following spec:
```
{
  log_id = int; // primary key
  name = string; //matches the config name above
  date = Date;
  value = int; // an amount for type 1, 1 for type 2, 0/1 for type 3
}
```

Things that can be calculated using SQL (or TS):
- total sum for a given day or week
- is currently active (last set to 0 or 1)
- last start (set to 1)
- last stop (set to 0)

#### UI:

The main page is a bunch of easily accessed tracking buttons.

Type 1: clicking button = track 1 instance, or opens a modal to enter an amount with a text field.

Type 2: clicking button = track 1 instance.

Type 3: indicates active status via button color. Clicking button = toggle status.

All 3 types have a "counter" next to the buttons to indicate the relevant tracking number, whether that's "amount so far", "days left", "days since", etc.

### Sub-tasks

Sometimes a task might have a parent category. Eg: logging an instance of hobby or exercise, but also logging which one. 

For this, a task can have a certain task listed as its parent. If that exists, clicking the parent button opens the child buttons.