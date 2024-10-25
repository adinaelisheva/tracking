<?php
/* Usage: GET config.php
*    name: "Apples" // Name of the tracking category
*  Returns info for given config
*/
  include("common.php"); 
  $name = $_GET["name"];

  if ($name) {

    $sql = "SELECT * from configs WHERE `name` = '$name'"; 
    
    $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));
    $entry = mysqli_fetch_assoc($entryresult);

    echo(json_encode($entry, JSON_NUMERIC_CHECK|JSON_PRETTY_PRINT));
  }
  
?> 
