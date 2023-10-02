<?php
/* Usage: GET logs.php
*   name: "Apples" // Name of the tracking category (optional)
*  Returns all logs in the past 30 days
*/
  include("common.php"); 

  $json = [];

  $pastdate = date("Y-m-d",strtotime("-30 days"));
  $name = $_GET["name"];

  $sql = "SELECT * from logs WHERE `date` > '$pastdate'"; 

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
