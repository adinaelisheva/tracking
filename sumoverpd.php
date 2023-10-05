<?php
/* Usage: GET sumoverpd.php
*   name: "Apples" // Name of the tracking category
*   period: "M" // The period to sum over. Can be "D", "W", or "M"
*  Returns sum of all values over that period
*/
  include("common.php"); 

  $name = $_GET["name"];
  if (empty($name)) die('{"Error":"Name cannot be empty"}');
  $pd = $_GET["period"];
  if (empty($pd)) die('{"Error":"Period cannot be empty"}');
  $date = $_GET["date"];
  if (empty($date)) die('{"Error":"Date cannot be empty"}');

  // Default to D 
  $lastDate = strtotime($date);
  if ($pd == "W") {
    $lastDate = strtotime('last sunday', strtotime($date));
  }
  if ($pd == "M") {
    $lastDate = strtotime('first day of this month');
  }

  $startStr = date("Y-m-d", $lastDate);
  $endstr = date("Y-m-d", strtotime($date));

  $sql = "SELECT SUM(value) as sum from logs WHERE `name` = '$name' AND `date` >= '$startStr' AND `date` <= '$endstr'"; 
  
  $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));
  $sum = mysqli_fetch_assoc($entryresult)["sum"];

  echo $sum;
  
?> 
