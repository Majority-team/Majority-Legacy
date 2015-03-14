$(function(){

	var reponses = [];
	var pseudo = "";

	// Connexion à socket.io
	var socket = io.connect();

	socket.emit('new_client');

	socket.on('new_question', function (data) {

		var question = data.question;
		
		$('#question > strong').text(question.question);

		for (var i = 0; i <= question.reponses.length - 1; i++) {

			$('#reponse' + (i+1)).text(question.reponses[i]);
		};

		$('.reponse').show();
	});

	socket.on('joueurs_par_reponses', function (data) {
		reponses = data;
	});

	socket.on('pseudo_joueur', function (data) {
		pseudo = data;
	});

	$('#reponse1').click(function(){
		socket.emit('answer', 1);
	});

	$('#reponse2').click(function(){
		socket.emit('answer', 2);
	});

	$('#reponse3').click(function(){
		socket.emit('answer', 3);
	});

	$('#reponse4').click(function(){
		socket.emit('answer', 4);
	});

	$(".reponse").click(function(){
		$('.reponse').hide();
	});

	$('#google').click(function(){
		socket.emit('google_connect');
	});
});

// Hack pour le bug d'url facebook
if (window.location.hash && window.location.hash === "#_=_") {
    window.location.hash = "";
}