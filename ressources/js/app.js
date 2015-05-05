$(function(){

	var reponses = [];
	var pseudo = "";
	var idJoueur = 0;
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

		$('#timer-plein').finish();
		$('#timer-plein').animate({width: "0%"}, 200, "linear").animate({width: "100%"}, data.temps - 200, "linear");
	});

	socket.on('joueurs_par_reponses', function (data) {
		joueurs = data;

		$('.joueurs-dans-la-reponse').html('');

		for (var i = joueurs.length - 1; i >= 0; i--) {
        	$('#joueurs-dans-la-reponse' + joueurs[i].id).append('<li><img class="photo-joueur" src="' + joueurs[i].photo + '"><span class="pseudo-joueur">' + joueurs[i].pseudo + '</span>');
    	}
	});

	socket.on('scores_partie', function (data) {

		var scores = data;
		var clientId = -1;

		// On ordonne les scores
		scores.sort(function (a, b) {
			return b.score - a.score;
		});

		for (var i = 0; i < scores.length; i++)
		{
			if (scores[i].pseudo.length > 12)
			{
				scores[i].pseudoOutput = scores[i].pseudo.substring(0,9) + "...";
			}
			else
			{
				scores[i].pseudoOutput = scores[i].pseudo;
			}

			if (scores[i].idJoueur === idJoueur)
			{
				clientId = i;
				scores[i].pseudoOutput = "Vous";
			}
		}
		
		var textNbJoueurs = "joueur";
		if(scores.length > 1) {textNbJoueurs = "joueurs"}

		$('#classement-partie ul').html('<li style="text-align: center; font-size: 13px; font-style: italic; margin: 0 0 10px 0">'+ scores.length +' '+ textNbJoueurs +'</li>');

		for (var i = 0; i < 3; i++) {
			
			if(scores[i] !== undefined)
			{
				$('#classement-partie ul').append('
					<li>
						<div class="joueur-classement">
							<span class="position-classement">' + (i + 1) + '.</span>
							<img class="photo-joueur-classement" src="' + scores[i].photo + '">
							<span class="pseudo-classement" title="'+ scores[i].pseudo +'">'+ scores[i].pseudoOutput +'</span>
						</div>
						<span class="score-classement">'+ scores[i].score +' pts</span>
					</li>'
				);
			}
		}

		if (clientId >= 3 && clientId !== -1)
		{
			console.log(clientId);
			$('#classement-partie ul').append('
				<li>...</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">'+ (clientId + 1) +'.</span>
						<img class="photo-joueur-classement" src="' + scores[clientId].photo + '">
						<span class="pseudo-classement" title="'+ scores[clientId].pseudo +'">'+ scores[clientId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[clientId].score +' pts</span>
				</li>'
			);
		}
	});

	socket.on('partie_precedente', function (data) {

		var scores = data;
		var clientId = -1;

		// On ordonne les scores
		scores.sort(function (a, b) {
			return b.score - a.score;
		});

		for (var i = 0; i < scores.length; i++)
		{
			if (scores[i].pseudo.length > 12)
			{
				scores[i].pseudoOutput = scores[i].pseudo.substring(0,9) + "...";
			}
			else
			{
				scores[i].pseudoOutput = scores[i].pseudo;
			}

			if (scores[i].pseudo === pseudo)
			{
				clientId = i;

				if (/Anonyme [\d]+/g.test(scores[i].pseudo))
				{
					scores[i].pseudoOutput = "Vous";
				}
			}
		}

		var textNbJoueurs = "joueur";
		if(scores.length > 1) {textNbJoueurs = "joueurs"}

		$('#classement-partie-precedente ul').html('<li style="text-align: center; font-size: 13px; font-style: italic; margin: 0 0 10px 0">'+ scores.length +' '+ textNbJoueurs +'</li>');

		for (var i = 0; i < 3; i++) {
			
			if(scores[i] !== undefined)
			{
				$('#classement-partie-precedente ul').append('
					<li>
						<div class="joueur-classement">
							<span class="position-classement">' + (i + 1) + '.</span>
							<img class="photo-joueur-classement" src="' + scores[i].photo + '">
							<span class="pseudo-classement" title="'+ scores[i].pseudo +'">'+ scores[i].pseudoOutput +'</span>
						</div>
						<span class="score-classement">'+ scores[i].score +' pts</span>
					</li>'
				);
			}
		}

		if (clientId >= 3 && clientId !== -1)
		{
			console.log(clientId);
			$('#classement-partie-precedente ul').append('
				<li>...</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">'+ (clientId + 1) +'.</span>
						<img class="photo-joueur-classement" src="' + scores[clientId].photo + '">
						<span class="pseudo-classement" title="'+ scores[clientId].pseudo +'">'+ scores[clientId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[clientId].score +' pts</span>
				</li>'
			);
		}
	});

	socket.on('scores_semaine', function (data) {

		var scores = data;
		var clientId = -1;

		// On ordonne les scores
		scores.sort(function (a, b) {
			return b.score - a.score;
		});

		for (var i = 0; i < scores.length; i++)
		{
			if (scores[i].pseudo.length > 12)
			{
				scores[i].pseudoOutput = scores[i].pseudo.substring(0,9) + "...";
			}
			else
			{
				scores[i].pseudoOutput = scores[i].pseudo;
			}

			if (scores[i].pseudo === pseudo)
			{
				clientId = i;

				if (/Anonyme [\d]+/g.test(scores[i].pseudo))
				{
					scores[i].pseudoOutput = "Vous";
				}
			}
		}

		var textNbJoueurs = "joueur";
		if(scores.length > 1) {textNbJoueurs = "joueurs"}

		$('#classement-semaine ul').html('<li style="text-align: center; font-size: 13px; font-style: italic; margin: 0 0 10px 0">'+ scores.length +' '+ textNbJoueurs +'</li>');

		for (var i = 0; i < 3; i++) {
			
			if(scores[i] !== undefined)
			{
				$('#classement-semaine ul').append('
					<li>
						<div class="joueur-classement">
							<span class="position-classement">' + (i + 1) + '.</span>
							<img class="photo-joueur-classement" src="' + scores[i].photo + '">
							<span class="pseudo-classement" title="'+ scores[i].pseudo +'">'+ scores[i].pseudoOutput +'</span>
						</div>
						<span class="score-classement">'+ scores[i].score +' pts</span>
					</li>'
				);
			}
		}

		if (clientId >= 3 && clientId !== -1)
		{
			$('#classement-semaine ul').append('
				<li>...</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">'+ (clientId + 1) +'.</span>
						<img class="photo-joueur-classement" src="' + scores[clientId].photo + '">
						<span class="pseudo-classement" title="'+ scores[clientId].pseudo +'">'+ scores[clientId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[clientId].score +' pts</span>
				</li>'
			);
		}
	});

	socket.on('ids_gagnants', function (data) {
		gagnants = data;
		for (var i = 0; i < gagnants.length; i++)
		{
			if (gagnants[i].id === idJoueur)
			{
				$('.win').html('+' + (gagnants[i].score_ajout + gagnants[i].combo_ajout));
				$('.win').attr('style', "");
				$('.win').animate({opacity: "0"}, 1500);
				playWinNotif();
			}
		}
	});

	socket.on('pseudo_joueur', function (data) {
		pseudo = data;
		$('#pseudo-utilisateur').html(pseudo);

		if (!/Anonyme [\d]+/g.test(pseudo))
		{
			$('#bouton-logout').toggle();
			$('.bouton-connexion').toggle();
		}
	});

	socket.on('id_joueur', function (data) {
		idJoueur = data;
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

// Audio

var audio = document.getElementById("audio"),
	playimg = document.getElementById("playimg"),
	pauseimg = document.getElementById("pauseimg"); 

function playAudio() {
 	audio.loop = true;
    audio.play();
    audio.volume = 0.1;
    playimg.style.display = "none" ;
    pauseimg.style.display = "" ;
}

function pauseAudio() { 
    audio.pause();
    playimg.style.display = "" ;
    pauseimg.style.display = "none" ; 
}



var winNotif = document.getElementById("winNotif");

function playWinNotif() {
 	winNotif.loop = false;
    winNotif.play();
    winNotif.volume = 1;
}