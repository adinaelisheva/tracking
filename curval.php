<?php
/* Usage: GET curval.php
*   name: "Apples" // Name of the tracking category
*  Returns current value for that category
*/
  include("common.php"); 

  $value = -1;
  $name = $_GET["name"];

  if ($name) {
    $sql = "SELECT * from logs WHERE `name` = '$name' ORDER BY date DESC LIMIT 1"; 
    
    $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));
  
    $value = mysqli_fetch_assoc($entryresult)["value"];
  
  }

  echo $value;
  
?> 
