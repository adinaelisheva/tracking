<?php
/* Usage: GET configs.php
*  Returns all tracking configs
*/
  include("common.php"); 

  $json = [];

  $sql = "SELECT * from configs ORDER BY `configs`.`priority` DESC, `configs`.`type` ASC"; 
  
  $entryresult = mysqli_query($db, $sql) or die(mysqli_error($db));

  while ($entry = mysqli_fetch_assoc($entryresult)) {
      $json[] = $entry;
  }

  echo(json_encode($json, JSON_NUMERIC_CHECK|JSON_PRETTY_PRINT));
  
?> 
