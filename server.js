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
	questionsParPartie = 10,
	tempsParQuestion = 10000,
	tempsEntreParties = 10000,
	lancerLesQuestions = null,
	scores = [],
	reponses = [],
	first_question = true,
	jsonScores = [],
	compteurJoueurServeur = 1,
	idsGagnants = [];

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

		// Variable d'utilisateur contenant les identifiants si connecté : socket.handshake.session.passport.user
		// Variable de session où sont stockées les informations utilisateur : socket

		// Envoi des scores de la semaine au joueur
		fs.readFile(__dirname + '/ressources/data/scores_semaine.json', function (err, data) {
			if (err) throw err;
			socket.emit('scores_semaine', JSON.parse(data));
		});

		// +1 au nombre total de joueurs s'étant connectés
		compteurJoueurServeur++;

		// Joueur identifié ?
		if (socket.handshake.session.passport.user === undefined)
		// Non
		{
			// Attribution d'un id selon le nombre total de joueurs s'étant connectés
			socket.idJoueur = compteurJoueurServeur;

			// Attribution d'un pseudo du type : "Anonyme " + id
			socket.pseudo = "Anonyme " + (compteurJoueurServeur);

			// Attribution de la photo des utilisateurs anonymes
			socket.photo = "/images/logo.png";
		}
		else
		// Oui
		{
			// Récupération de l'identifiant
			socket.idJoueur = socket.handshake.session.passport.user.idJoueur;

			// Récupération du pseudo
			socket.pseudo = socket.handshake.session.passport.user.pseudo;

			// Récupération de la photo
			socket.photo = socket.handshake.session.passport.user.photo;
		}

		// Envoi du pseudo du joueur au joueur
		socket.emit('pseudo_joueur', socket.pseudo);

		// Envoi de l'id du joueur au joueur
		socket.emit('id_joueur', socket.idJoueur);

		// Envoi des scores de la partie en cours au joueur
		socket.emit('scores_partie', scores);
	});

	// Reponse envoyée
	socket.on('answer', function (idReponse) {

		// Si l’utilisateur n’est pas défini, on le défini
		if (socket.pseudo === undefined || socket.idJoueur === undefined)
		{
			compteurJoueurServeur++;

			// On ajoute au tableau des scores un nouveau joueur
			socket.pseudo = "Anonyme " + compteurJoueurServeur;
			socket.idJoueur = compteurJoueurServeur;
			socket.photo = "/images/logo.png";

			socket.emit('id_joueur', socket.idJoueur);
		}

		// On vérifie que l'utilisateur n'est pas dans le tableau des scores
		socket.inScores = false;

		for (var i = 0; i < scores.length; i++)
		{
			if (scores[i].pseudo === socket.pseudo)
			{
				socket.inScores = true;
			}
		}

		// Si il n'y est pas on l'y ajoute
		if (!socket.inScores)
		{
			scores.push({"pseudo": socket.pseudo, "score": 0, "idJoueur": socket.idJoueur, "combo": 0, "photo": socket.photo});
		}

		// On vérifie que l'utilisateur n'a pas déja répondu
		socket.answered = false;

		for (var i = 0; i < reponses.length; i++)
		{
			if (reponses[i].pseudo === socket.pseudo)
			{
				socket.answered = true;
			}
		}

		// Si il n'a pas répondu
		if(!socket.answered)
		{
			// On note l'id de la reponse
			reponses.push({"id": idReponse, "pseudo": socket.pseudo, "idJoueur": socket.idJoueur, "photo": socket.photo});
			// On actualise les joueurs par réponse pour chaque client
			io.emit('joueurs_par_reponses', reponses);
		}
	});

	socket.on('message_chat', function (message) {
		io.emit('new_message_chat', {"message": message, "pseudo": socket.pseudo, "photo": socket.photo});
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
		io.emit('scores_partie', scores);
	}
	else
	{
		first_question = false;
	}

	// On vide le tableau des reponses
	reponses = [];
	
	io.emit('ids_gagnants', idsGagnants);
	idsGagnants = [];

	// Si la partie n'est pas finie :
	if (questionsUtilisees.length < questionsParPartie)
	{
		// On choisi une question au hasard
		question = chooseQuestion(question);

		// On envoie la question
		io.emit('new_question', {"question": question, "temps": tempsParQuestion, "numero": questionsUtilisees.length});
	}
	else
	{
		// Sinon on arrete d'envoyer des questions
		clearInterval(lancerLesQuestions);

		// On relance la partie après tempsEntreParties ms
		var startNewgame = setTimeout(newGame, tempsEntreParties);

		// On réinitialise les questions utilisées
		questionsUtilisees = [];

		// On réinitialise les scores
		scores = [];

		io.emit('scores_partie', scores);
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




/********************************* Comptage des points *************************************/




function updateScore()
{
fs.readFile(__dirname + '/ressources/data/scores_semaine.json', function (err, data){
	if (err) throw err;
	jsonScores = JSON.parse(data);
},'json');

	var totalScores = scores.length;
	var totalAnswers = reponses.length;
	var totalJsonScores = jsonScores.length;

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
		for(i = 0; i < totalScores; ++i)
		{
			// On récupère l'index du joueur dans les différents tableaux à modifier.
			var idsArray = seekMatchingEntries(i, totalJsonScores, totalAnswers);
			var idRep = idsArray[0];
			var idJson = idsArray[1];

			if(idRep != -1 && idJson !== -1)
			{
				// 1e réponse
				if (answerCount[0][0] !== answerCount[1][0])
				{
					if(reponses[idRep].id == answerCount[0][1])
					{
						scores[i].score += 2; // 2 point pour la réponse majoritaire
						jsonScores[idJson].score += 2;
						++scores[i].combo; // +1 au compteur de bonnes réponses consécutives
						var current_combo = addComboToScore(i, idJson);
						idsGagnants.push({'id': scores[i].idJoueur, 'score_ajout': 2, 'combo_ajout': current_combo });
					}
				}
				else
				{
					console.log('Egalité 1e rep (mode massif)');
				}
				// 2e réponse
				if (answerCount[0][0] !== answerCount[1][0] && answerCount[1][0] !== answerCount[2][0])
				{
					if(reponses[idRep].id == answerCount[1][1])
					{
						++scores[i].score; // 1 point pour la deuxième réponse majoritaire
						++jsonScores[idJson].score;
						scores[i].combo = 0; // remise à zéro du compteur bonnes réponses consécutives
						idsGagnants.push({'id': scores[i].idJoueur, 'score_ajout': 1, 'combo_ajout': 0 });
					}
				}
				else
				{
					console.log('Egalité 2e rep (mode massif)');
				}
				// autre
				if(reponses[idRep].id != answerCount[1][1] || reponses[idRep].id != answerCount[0][1])
				{
					scores[i].combo = 0; // remise à zéro du compteur bonnes réponses consécutives
				}
			}
			else
			{
				scores[i].combo = 0;
			}
		}
	}
	else
	{
		if (answerCount[0][0] !== answerCount[1][0])
		{
			// Pour chaque réponse
			for(i = 0; i < totalScores; ++i)
			{
				// On récupère l'index du joueur dans les différents tableaux à modifier.
				var idsArray = seekMatchingEntries(i, totalJsonScores, totalAnswers);
				var idRep = idsArray[0];
				var idJson = idsArray[1];

				if(idRep !== -1 && idJson !== -1)
				{
					// 1e réponse
					if (reponses[idRep].id == answerCount[0][1]) // 1 point pour la réponse majoritaire
					{
						++scores[i].score;
						++jsonScores[idJson].score;
						++scores[i].combo; // +1 au compteur de bonnes réponses consécutives
						var current_combo = addComboToScore(i, idJson);
						idsGagnants.push({'id': scores[i].idJoueur, 'score_ajout': 1, 'combo_ajout': current_combo });
					}
					// autre
					else
					{
						scores[i].combo = 0; // remise à zéro du compteur bonnes réponses consécutives
					}
				}
				else
				{
					scores[i].combo = 0;
				}
			}
		}
		else
		{
			// console.log('Egalité 1e rep (mode privé)');
		}
	}

	fs.writeFile(__dirname + '/ressources/data/scores_semaine.json', JSON.stringify(jsonScores, null, 4), function (err, data) {
		if (err) throw err;
	});

	io.emit('scores_semaine', jsonScores);
}

function addComboToScore(arrayID, jsonID) {
	// points de combo :
	// 2 points toutes les 2*n réponses cumulées de suite,
	// à partir de 4 réponses de suite)
	if(scores[arrayID].combo > 0 && scores[arrayID].combo % 2 == 0)
	{
		var combovalue = (scores[arrayID].combo/2)-1;
		scores[arrayID].score += combovalue;
		jsonScores[jsonID].score += combovalue;
		return combovalue;
	}
	return 0;
}

function seekMatchingEntries(idScore, totalJson, totalAns)
{
	// On initialise les id en erreur (-1)
	var idRep = -1;
	var idJson = -1;
	// Aucune vérification de tableau n'est terminée
	var jsonProcessed = false;
	var reponseProcessed = false;
	// On parcourt les deux tableau (réponses et Json) simultanément
	// On utilise une boucle infinie pour incrémenter l'index recherché
	for(var y = 0; 1==1 ; ++y)
	{
		// Si cette vérification n'est pas terminée
		if(!jsonProcessed)
		{
			if(y >= totalJson)
			{
				// Si on est à la fin du tableau, l'utilisateur n'existe pas encore.
				// On le crée, puis on termine cette vérification.
				jsonScores.push({"pseudo": scores[idScore].pseudo, "score": 0, "idJoueur": scores[idScore].idJoueur, "photo": scores[idScore].photo});
				idJson = totalJson;
				jsonProcessed = true;
			}
			else if(scores[idScore].idJoueur === jsonScores[y].idJoueur )
			{
				// Si l'utilisateur existe, on renseigne son index
				// et on arrête cette vérification.
				idJson = y;
				jsonProcessed = true;
			}
		}

		// Si cette vérification n'est pas terminée
		if(!reponseProcessed)
		{
			if(y >= totalAns)
			{
				// Si on est à la fin du tableau, l'utilisateur n'a pas répondu.
				// On termine cette vérification en laissant l'erreur (-1) en index.
				reponseProcessed = true;
			}
			else if(scores[idScore].idJoueur === reponses[y].idJoueur )
			{
				// Si l'utilisateur existe, on renseigne son index
				// et on arrête cette vérification.
				idRep = y;
				reponseProcessed = true;
			}
		}

		// Si toutes les vérifications sont terminées, on casse la boucle infinie.
		if(reponseProcessed && jsonProcessed)
		{
			break;
		}
	}

	// On renvoie les index correspondant au joueur traité dans les différents tableaux
	return [idRep, idJson];
}

// Lancement du serveur sur le port 8080
server.listen(8080);
