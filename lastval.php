<?php
/* Usage: GET curval.php
*   name: "Apples" // Name of the tracking category
*   value: 1 // The value being sought
*  Returns last date when that category had that value
*/
  include("common.php"); 

  $name = $_GET["name"];
  if (empty($name)) die('{"Error":"Name cannot be empty"}');
  $value = $_GET["value"];
  if (empty($value)) {
    $value = 0;
  }

  $sql = "SELECT * from logs WHERE `name` = '$name' AND `value` = '$value' ORDER BY date DESC LIMIT 1"; 
  
  $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));

  $lastdate = mysqli_fetch_assoc($entryresult)["date"];

  echo $lastdate;
  
?> 
