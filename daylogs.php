<?php
/* Usage: GET logs.php
*   name: "Apples" // Name of the tracking category (optional)
*  Returns all logs in the past day
*/
  include("common.php"); 

  $json = [];

  $name = $_GET["name"];
  if (empty($name)) die('{"Error":"Name cannot be empty"}');
  $date = $_GET["date"];
  if (empty($date)) die('{"Error":"Date cannot be empty"}');
  $dateStr = date("Y-m-d", strtotime($date));
  $sql = "SELECT * from logs WHERE `date` = '$dateStr'"; 

  if ($name) {
    $sql = $sql . " AND name = '$name'"; 
  }

  $sql = $sql . " ORDER BY `logs`.`date` DESC;"; 

  $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));

  while ($entry = mysqli_fetch_assoc($entryresult)) {
      $json[] = $entry;
  }

  echo(json_encode($json, JSON_NUMERIC_CHECK|JSON_PRETTY_PRINT));
  
?> 
