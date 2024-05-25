<?php
/* Usage: GET monthlogs.php
*   name: "Apples"   // Name of the tracking category (optional)
*   date: YYYY-MM-DD // Date to go up to (optional)
*   days: 30         // Number of days to fetch (optional, defaults to 30)
*   children: 1      // Boolean - whether to fetch the children of this config (optional)
*  Returns all logs in the past N (default 30) days, up to the given date (default today)
*/
  include("common.php"); 

  $json = [];

  $name = $_GET["name"];
  $date = $_GET["date"];
  $children = $_GET["children"];
  if (empty($date)) { 
    $date = time();
  } else {
    $date = strtotime($date);
  }
  $days = $_GET["days"];
  if (empty($days)) {
    $days = 30;
  }

  $pastdate = date("Y-m-d",strtotime("-$days days"));
  $date = date("Y-m-d",$date);

  if (!empty($name) && !empty($children)) {
    $sql = "SELECT * from logs WHERE REPLACE(name, '_', ' ') IN (SELECT `name` FROM configs WHERE parent = '$name') AND ";
  } else {
    $sql = "SELECT * from logs WHERE "; 
  }
  $sql = $sql . " `date` > '$pastdate' AND `date` <= '$date' ";
  if (!empty($name) && empty($children)) {
    $sql = $sql . " AND name = '$name' "; 
  }

  $sql = $sql . " ORDER BY `logs`.`date` DESC;"; 

  $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));

  while ($entry = mysqli_fetch_assoc($entryresult)) {
      $json[] = $entry;
  }

  echo(json_encode($json, JSON_NUMERIC_CHECK|JSON_PRETTY_PRINT));
  
?> 
