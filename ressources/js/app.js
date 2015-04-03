$(function(){

	var reponses = [];
	var pseudo = "";
	var answered = false;

	$('#bouton-logout').hide();

	// Connexion à socket.io
	var socket = io.connect();

	socket.emit('new_client');

	socket.on('new_question', function (data) {

		var question = data.question;

		answered = false;
		
		$('#question-text').text(question.question);
		$('#question-number').text("Question " + data.numero);

		for (var i = 0; i <= question.reponses.length - 1; i++) {

			$('#reponse' + (i+1) + ' .reponse').text(question.reponses[i]);
		};

		$('.reponse').show();
		$('.joueurs-dans-la-reponse').hide().html('');


		$('#timer-plein').animate({width: "0%"}, 200, "linear").animate({width: "100%"}, data.temps - 200, "linear");
	});

	socket.on('joueurs_par_reponses', function (data) {
		joueurs = data;

		$('.joueurs-dans-la-reponse').html('');

		for (var i = joueurs.length - 1; i >= 0; i--) {
        $('#joueurs-dans-la-reponse' + joueurs[i].id).append('<li><img class="photo-joueur" src="' + joueurs[i].photo + '"><span class="pseudo-joueur">' + joueurs[i].pseudo + '</span>');
    	}
	});

	socket.on('pseudo_joueur', function (data) {
		pseudo = data;
		$('#pseudo-utilisateur').html(pseudo);

		if (!/Anonyme[\d]+/g.test(pseudo))
		{
			$('#bouton-logout').toggle();
			$('.bouton-connexion').toggle();
		}
	});

	$('#reponse1').click(function(){
		if (!answered)
		{
			socket.emit('answer', 1);
			answered = true;
		}
	});

	$('#reponse2').click(function(){
		if (!answered)
		{
			socket.emit('answer', 2);
			answered = true;
		}
	});

	$('#reponse3').click(function(){
		if (!answered)
		{
			socket.emit('answer', 3);
			answered = true;
		}
	});

	$('#reponse4').click(function(){
		if (!answered)
		{
			socket.emit('answer', 4);
			answered = true;
		}

	});

	$('.button-reponse').click(function () {
		console.log($('.reponse'));
	    $('.reponse').hide();
	    $('.joueurs-dans-la-reponse').show();
	});

	/******* ******/
	$(document).ready(function() {
		$('.cookie-message').cookieBar('.my-boutton');
		$(".fancybox").fancybox();
		$('.my-boutton').click(function() { });

		$(".fancybox").fancybox({
			padding: 5,

			openEffect : 'elastic',
			openSpeed  : 150,

			closeEffect : 'elastic',
			closeSpeed  : 150,


			helpers : {
				overlay : {
					css : {
						'background' : 'rgba(0,0,0,0.85)'
					}
				}
			}
		});
	});
});

// Hack pour le bug d'url facebook
if (window.location.hash && window.location.hash === "#_=_") {
    window.location.hash = "";
}