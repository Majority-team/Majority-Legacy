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

	socket.on('scores_partie', function (data) {

		var scores = data;
		var premierId = -1;
		var secondId = -1;
		var troisiemeId = -1;
		var clientId = -1;

		for (var i = 0; i < scores.length; i++)
		{
			if (premierId < 0)
			{
				premierId = i;
			}

			if (scores[i].score >= scores[premierId].score && i !== premierId)
			{
				troisiemeId = secondId;
				secondId = premierId;
				premierId = i;
			}

			if (scores[i].score >= scores[premierId].score && i !== premierId)
			{
				troisiemeId = secondId;
				secondId = premierId;
				premierId = i;
			}

			if (scores[i].pseudo === pseudo)
			{
				clientId = i;
			}
		}

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
		}

		if(troisiemeId >= 0)
		{
			$('#classement-partie ul').html('
				<li>
					<div class="joueur-classement">
						<span class="position-classement">1.</span>
						<img class="photo-joueur-classement" src="' + scores[premierId].photo + '">
						<span class="pseudo-classement" title="'+ scores[premierId].pseudo +'">'+ scores[premierId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[premierId].score +' pts</span>
				</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">2.</span>
						<img class="photo-joueur-classement" src="' + scores[secondId].photo + '">
						<span class="pseudo-classement" title="'+ scores[secondId].pseudo +'">'+ scores[secondId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[secondId].score +' pts</span>
				</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">3.</span>
						<img class="photo-joueur-classement" src="' + scores[troisiemeId].photo + '">
						<span class="pseudo-classement" title="'+ scores[troisiemeId].pseudo +'">'+ scores[troisiemeId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[troisiemeId].score +' pts</span>
				</li>'
			);
		}

		if(secondId >= 0 && troisiemeId < 0)
		{
			$('#classement-partie ul').html('
				<li>
					<div class="joueur-classement">
						<span class="position-classement">1.</span>
						<img class="photo-joueur-classement" src="' + scores[premierId].photo + '">
						<span class="pseudo-classement" title="'+ scores[premierId].pseudo +'">'+ scores[premierId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[premierId].score +' pts</span>
				</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">2.</span>
						<img class="photo-joueur-classement" src="' + scores[secondId].photo + '">
						<span class="pseudo-classement" title="'+ scores[secondId].pseudo +'">'+ scores[secondId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[secondId].score +' pts</span>
				</li>'
			);
		}

		if(premierId >= 0 && secondId < 0)
		{
			$('#classement-partie ul').html('
				<li>
					<div class="joueur-classement">
						<span class="position-classement">1.</span>
						<img class="photo-joueur-classement" src="' + scores[premierId].photo + '">
						<span class="pseudo-classement" title="'+ scores[premierId].pseudo +'">'+ scores[premierId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[premierId].score +' pts</span>
				</li>'
			);
		}

		if (clientId !== troisiemeId && clientId !== secondId && clientId !== premierId)
		{
			$('#classement-partie ul').append('
				<li>...</li>
				<li>
					<div class="joueur-classement">
						<span class="position-classement">'+ clientId +'.</span>
						<img class="photo-joueur-classement" src="' + scores[clientId].photo + '">
						<span class="pseudo-classement" title="'+ scores[clientId].pseudo +'">'+ scores[clientId].pseudoOutput +'</span>
					</div>
					<span class="score-classement">'+ scores[clientId].score +' pts</span>
				</li>'
			);
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