<?php
/* Usage: GET getyesterday.php
*  Returns yesterday's date bc php is much better at dates than JS
*/
  include("common.php"); 

  echo date("Y-m-d", strtotime("-1 days"));
  
?> 
