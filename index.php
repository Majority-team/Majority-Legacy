<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="utf-8"/>
	<title>Questions</title>
</head>
<body>
<form action="index.php" method="post">
	<input type="text" name="question" placeholder="Question">
	<input type="text" name="reponse1" placeholder="Réponse 1">
	<input type="text" name="reponse2" placeholder="Réponse 2">
	<input type="text" name="reponse3" placeholder="Réponse 3">
	<input type="text" name="reponse4" placeholder="Réponse 4">

	<input type="submit" name="submit" value="Valider">
</form>

<?php
if ($_POST["submit"] == "Valider")
{
	$text = '{ "question": "' .$_POST["question"]. '", "reponses": ["' .$_POST["reponse1"]. '", "' .$_POST["reponse2"]. '", "' .$_POST["reponse3"]. '", "' .$_POST["reponse4"]. '"]},';
	$myFile = "questions.json";
	$fh = fopen($myFile, 'a+') or die("can't open file");
	fwrite($fh, $text);
	fclose($fh);
}
?>

</body>
</html>