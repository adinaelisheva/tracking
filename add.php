<?php

/*
*  Usage: POST add.php
*    name: "Apples" // Name of the tracking category
*    value: 1 // optional for tracking categories that have variable amounts
*    date: "2016-07-12" // Date of the instance, optional (if unspecified, assume 'now')
*
*  Returns: JSON representation of new log, or object with "Error" key if failure
*/

  include("common.php");

  $params = json_decode(file_get_contents('php://input'));

  $name = mysqli_real_escape_string($db, $params->name);
  if (empty($name)) die('{"Error":"Name cannot be empty"}');
  $value = mysqli_real_escape_string($db, $params->value);
  if (empty($value)) {
    $value = 0;
  }
  $date = mysqli_real_escape_string($db, $params->date);
  if (empty($date)) die('{"Error":"Date cannot be empty"}');

  $datestr = date ("Y-m-d", strtotime($date));

  $sql = "INSERT INTO logs (name, value, date) VALUES ('$name', $value, '$datestr');";
 
  echo("<br><br>SQL: $sql<br>");
  
  $result = mysqli_query($db, $sql) or die('{"Error":"'+mysqli_error($db)+'"}');

  echo("Executed<br>");
  
  $result = mysqli_query($db, "SELECT * FROM logs WHERE id = {$db->insert_id} LIMIT 1") or die('{"Error":"'+mysqli_error($db)+'"}');
  $entry = mysqli_fetch_assoc($result);

  echo(json_encode($entry, JSON_NUMERIC_CHECK));
?>
