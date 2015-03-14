// Initialisation du serveur
var express = require('express');
var fs = require('fs');
var	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);



/****************************** GESTION DES CONNECTIONS **********************************/



// Dépendances des cookies en tant que variables de session
var cookieParser = require('cookie-parser')();
var session = require('cookie-session')({ secret: 'majority is the key' });

app.use(cookieParser);
app.use(session);

// Déclaration des cookies dans socket.io
io.use(function (socket, next) {
    var req = socket.handshake;
    var res = {};
    cookieParser(req, res, function (err) {
        session(req, res, next);
    });
});

// Dépendances de passport
var passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	TwitterStrategy = require('passport-twitter').Strategy;

app.use(passport.initialize());



// Methode d'identification Google
passport.use(new GoogleStrategy({
		clientID: "498837580813-rm7m49o80e2l2gss6lrm2q75bbdftl2g.apps.googleusercontent.com",
		clientSecret: "F8IxXj02PC5fPIzmSLJivMsA",
		callbackURL: "http://127.0.0.1:8080/auth/google/callback",
		profileFields: ['id', 'displayName', 'photos']
	},
	function (req, accessToken, refreshToken, profile, done) {
		profile.photos = [];
		profile.photos.push({"value": profile._json.picture});
		done(null, profile);
	}
));

// Url d'identification Google
app.get('/auth/google', passport.authenticate('google', {scope: 'https://www.googleapis.com/auth/plus.login'}));

// Url de callback Google
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/');
});


// Methode d'identification Facebook
passport.use(new FacebookStrategy({
		clientID: "812477628788555",
		clientSecret: "4408c18ddbb035e900170c0c5c6867b1",
		callbackURL: "http://localhost:8080/auth/facebook/callback",
		profileFields: ['id', 'displayName', 'photos']
	},
	function (req, accessToken, refreshToken, profile, done) {
		done(null, profile);
	}
));

// Url d'identification Facebook
app.get('/auth/facebook', passport.authenticate('facebook'));

// Url de callback Facebook
app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/');
});


// Methode d'identification Twitter
passport.use(new TwitterStrategy({
		consumerKey: "teeqDZxvDxJHj1tx5A67PPoEk",
		consumerSecret: "fILFhYATWUUnoU64lhFFHXjO2nVZgRKHXHTfsZZySnx3qbpSKQ",
		callbackURL: "http://127.0.0.1:8080/auth/twitter/callback",
		profileFields: ['id', 'displayName', 'photos']
	},
	function (req, accessToken, refreshToken, profile, done) {
     	done(null, profile);
	}
));


// Url d'identification Twitter
app.get('/auth/twitter', passport.authenticate('twitter'));

// Url de callback Twitter
app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }), function(req, res) {
    res.redirect('/');
});



// Enregistrement de l'utilisateur dans les variables de session
passport.serializeUser(function(user, done) {
	user = { provider: user.provider,
		idJoueur: user.id,
		pseudo: user.displayName,
		photo: user.photos[0].value
	};
 	done(null, user);
});

// Récupération de l'utilisateur dans les variables de session
passport.deserializeUser(function(user, done) {
	done(null, user);
});

// Déconnexion
app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});



/************************* GESTION DES RESSOURCES DU SERVEUR ****************************/



// On déclare les variables du programme
var question = {},
	questionsUtilisees = [],
	questions = [],
	questionsParPartie = 3,
	tempsParQuestion = 8000,
	tempsEntreParties = 10000,
	lancerLesQuestions = null,
	scores = [],
	reponses = [],
	first_question = true;

// On recupère toutes les questions de la base de donnée dans le tableau "questions"
fs.readFile(__dirname + '/ressources/data/questions.json', function (err, data) {
	if (err) throw err;
	questions = JSON.parse(data);
});

// Chargement de la page index.html
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/views/index.html');
});

// Donne l'accès aux ressources a l'utilisateur
app.use(express.static(__dirname + '/ressources'));



/**************************** GESTION DE LA PARTIE CLIENT ********************************/



// On gere les fonctions client
io.on('connection', function (socket, pseudo) {

	// Nouvelle connection
	socket.on('new_client', function () {

		// Variable d'utilisateur : socket.handshake.session.passport.user
		if (socket.handshake.session.passport.user === undefined)
		{
			// On ajoute au tableau des scores un nouveau joueur
			socket.pseudo = "Anonyme" + (scores.length + 1);
			socket.idJoueur = scores.length + 1;
			socket.photo = "/images/logo.png"

			scores.push({"pseudo": socket.pseudo, "score": 0, "idJoueur": socket.idJoueur, "combo": 0, "photo": socket.photo});
		}
		else
		{
			socket.pseudo = socket.handshake.session.passport.user.pseudo;
			socket.idJoueur = socket.handshake.session.passport.user.idJoueur;
			socket.photo = socket.handshake.session.passport.user.photo;
			var youshallnotpass = false;
			for(var i = 0; i < scores.length; ++i)
			{
			  // On vérifie si l'id de joueur dans la ligne des scores
			  // correspond avec celui de la réponse traitée
			  if(scores[i].idJoueur === socket.idJoueur ) {
			    youshallnotpass = true;
			    break;
			  }
			}

			if (scores.indexOf(socket.handshake.session.passport.user.idJoueur) === -1 && !youshallnotpass)
			{
			  scores.push({"pseudo": socket.pseudo, "score": 0, "idJoueur": socket.idJoueur, "combo": 0, "photo": socket.photo});
			}
		}

		// On envoie le pseudo du joueur au joueur
		socket.emit('pseudo_joueur', socket.pseudo);
	});

	// Reponse envoyée
	socket.on('answer', function (idReponse) {

		if (socket.pseudo === undefined || socket.idJoueur === undefined)
		{
			// On ajoute au tableau des scores un nouveau joueur
			socket.pseudo = "Anonyme" + (scores.length + 1);
			socket.idJoueur = scores.length + 1;

			scores.push({"pseudo": socket.pseudo, "score": 0, "idJoueur": socket.idJoueur, "combo": 0, "photo": socket.photo});
		}


		// On note l'id de la reponse
		reponses.push({"id": idReponse, "pseudo": socket.pseudo, "idJoueur": socket.idJoueur, "photo": socket.photo});

		// On actualise les joueurs par réponse pour chaque client
		io.emit('joueurs_par_reponses', reponses);

	});
});



/********************************* TRAITEMENT DU JEU *************************************/



// On lance une partie
newGame();

// Quand un nouveau jeu est lancé on lance les questions tout les tempsParQuestion ms
function newGame() {
	first_question = true;
	lancerLesQuestions = setInterval(sendQuestion, tempsParQuestion);
}

// Fonction d'envoi des questions
function sendQuestion() {
	
	// On compte les points si ce n'est pas la premiere question
	if (first_question !== true)
	{
		// On actualise les score à partir des résultats de la question précédente
		updateScore();
	}

	// On vide le tableau des reponses
	reponses = [];

	// Si la partie n'est pas finie :
	if (questionsUtilisees.length < questionsParPartie)
	{
		// On choisi une question au hasard
		question = chooseQuestion(question);

		// On envoie la question
		io.emit('new_question', {"question": question, "temps": tempsParQuestion});

		console.log(scores);
	}
	else
	{
		// Sinon on arrete d'envoyer des questions
		clearInterval(lancerLesQuestions);

		// On relance la partie après tempsEntreParties ms
		var startNewgame = setTimeout(newGame, tempsEntreParties);

		io.emit('waiting_next_game', tempsEntreParties);

		// On réinitialise les questions utilisées
		questionsUtilisees = [];

		// On enregistre les scores de la partie dans le JSON "partie précédente"
		fs.writeFile(__dirname + '/ressources/data/partie_precedente.json', JSON.stringify(scores, null, 4), function (err, data) {
			if (err) throw err;
		});
	}
}

// Fonction pour choisir une question
function chooseQuestion(question) {
	// On en choisit une au hasard
	question = questions[Math.floor(Math.random() * questions.length)];

	// On verifie que la question n'est pas utilisée
	if (questionsUtilisees.indexOf(question) > -1)
	{
		// Si elle est utilisée on en envoie une autre au hasard tant qu'on en a pas une nouvelle
		while (questionsUtilisees.indexOf(question) > -1)
		{
			question = questions[Math.floor(Math.random() * questions.length)];
		}
	}

	// On ajoute la question aux questions utilisées
	questionsUtilisees.push(question);

	return question;
}

function updateScore() {
	// nombre total de réponses enregistrées
	var totalAnswers = reponses.length;

	// tableau contenant l'id de chaque réponse et le nombre de voix pour chaque réponse
	var answerCount  = [[0,1],[0,2],[0,3],[0,4]];

	// pour chaque voix, incrémentation du compteur de la réponse correspondante
	for(i = 0; i < totalAnswers; ++i)
	{
		switch(reponses[i].id)
		{
			case 1 : ++answerCount[0][0]; break;
			case 2 : ++answerCount[1][0]; break;
			case 3 : ++answerCount[2][0]; break;
			case 4 : ++answerCount[3][0]; break;
		}
	}

	// on trie les statistiques des réponses par nombre de voix décroissant.
	answerCount.sort( function(a,b){ return b[0] - a[0]; } );

	// proportion de voix accordée à la 1e et 2e réponse par rapport au total
	var ratio_first_answer = answerCount[0][1]/totalAnswers;
	var ratio_second_answer = answerCount[1][1]/totalAnswers;

	// Si +de 6 joueurs,
	// ratio de la 1ère réponse majoritaire <50%,
	// ratio de 2ème la réponse majoritaire >20%
	if(totalAnswers >= 6 && ratio_first_answer < 0.5 && ratio_second_answer >= 0.2)
	{
			// Pour chaque réponse
			for(i = 0; i < totalAnswers; ++i)
			{
				// On suppose qu'une erreur intervient
				var idFromReponse = -1;

				// On obtient la position du joueur dans le tableau des scores :
				// Pour toute entrée dans le tableau des scores
				for(var y = 0; y < scores.length; ++y)
				{
					// On vérifie si l'id de joueur dans la ligne des scores
					// correspond avec celui de la réponse traitée
					if(scores[y].idJoueur === reponses[i].idJoueur ) {
						idFromReponse = y;
						// Dès que la position du joueur dans les scores et connue,
						// on la place dans une variable et on sort de la boucle
						break;
					}
				}

				if(idFromReponse != -1)
				{
					// 1e réponse
					if (answerCount[0][0] !== answerCount[1][0])
					{
						if(reponses[i].id == answerCount[0][1])
						{
							scores[idFromReponse].score += 2; // 2 point pour la réponse majoritaire
							++scores[idFromReponse].combo; // +1 au compteur de bonnes réponses consécutives
						}
					}
					else
					{
						console.log('Egalité 1e rep <3');
					}
					// 2e réponse
					if (answerCount[0][0] !== answerCount[1][0] && answerCount[1][0] !== answerCount[2][0])
					{
						if(reponses[i].id == answerCount[1][1])
						{
							++scores[idFromReponse].score; // 1 point pour la deuxième réponse majoritaire
							scores[idFromReponse].combo = 0; // remise à zéro du compteur bonnes réponses consécutives
						}
					}
					else
					{
						console.log('Egalité 2e rep <3');
					}
					// autre
					if(reponses[i].id != answerCount[1][1] || reponses[i].id != answerCount[0][1])
					{
						scores[idFromReponse].combo = 0; // remise à zéro du compteur bonnes réponses consécutives
					}

					addComboToScore(idFromReponse);
				}
			}
	}
	else
	{
		if (answerCount[0][0] !== answerCount[1][0])
		{
			// Pour chaque réponse
			for(i = 0; i < totalAnswers; ++i)
			{
				// On suppose qu'une erreur intervient
				var idFromReponse = -1;

				// On obtient la position du joueur dans le tableau des scores :
				// Pour toute entrée dans le tableau des scores
				for(var y = 0; y < scores.length; ++y)
				{
					// On vérifie si l'id de joueur dans la ligne des scores
					// correspond avec celui de la réponse traitée
					if(scores[y].idJoueur === reponses[i].idJoueur ) {
						idFromReponse = y;
						// Dès que la position du joueur dans les scores et connue,
						// on la place dans une variable et on sort de la boucle
						break;
					}
				}

				if(idFromReponse !== -1)
				{
					// 1e réponse
					if (reponses[i].id == answerCount[0][1]) // 1 point pour la réponse majoritaire
					{
						++scores[idFromReponse].score;
						++scores[idFromReponse].combo; // +1 au compteur de bonnes réponses consécutives
					}
					// autre
					else
					{
						scores[idFromReponse].combo = 0; // remise à zéro du compteur bonnes réponses consécutives
					}
					addComboToScore(idFromReponse);
				}
			}
		}
		else
		{
			console.log('Egalité <3');
		}
	}
}

function addComboToScore(arrayID) {
	// points de combo :
	// 2 points toutes les 2*n réponses cumulées de suite,
	// à partir de 4 réponses de suite)
	if(scores[arrayID].combo > 0 && scores[arrayID].combo % 2 == 0)
	{
		scores[arrayID].score += (scores[arrayID].combo/2)-1;
	}
}


// Lancement du serveur sur le port 8080
server.listen(8080);
