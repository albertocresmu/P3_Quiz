
// Importo las funciones a medida que las necesito.
const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require('./out');

const {models} = require('./model');

/**
* Muestra la ayuda.
*
* @param rl	Objeto readline usado para implementar el CLI.
*/
exports.helpCmd = rl => {
	log("Comandos:");
	log("  h|help - Muestra esta ayuda.");
	log("  list - Listar los quizzes existentes.");
	log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
	log("  add - Añadir un nuevo quiz interactivamente.");
	log("  delete <id> - Borrar el quiz indicado.");
	log("  edit <id> - Editar el quiz indicado.");
	log("  test <id> - Probar el quiz indicado.");
	log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log("  credits - Créditos.");
	log("  q|quit - Salir del programa.");
	rl.prompt();
};

/**
* Lista todos los quizzes existentes en el modelo.
*
* @param rl	Objeto readline usado para implementar el CLI.
*/
exports.listCmd = rl => {
	models.quiz.findAll()
	.each(quiz => {
		log(`  [${colorize(quiz.id, 'magenta')}]: ${quiz.question} `);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Esta función devuelve una promesa que:
*	- Valida que se ha introducido un valor para el parámetro. 
*	- Convierte el parámetro en un número entero.
* Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
*
* @param id Parámetro con el índice a validar.
*/
const validateId = id => {
	return new Sequelize.Promise((resolve, reject) => {
		if (typeof id === "undefined") {
			reject(new Error(`Falta el parametro <id>.`));
		} else {
			id = parseInt(id);	// Coger la parte entera y descartar lo demás.
			if (Number.isNaN(id)) {
				reject(new Error(`El valor del parámetro <id> no es un número.`));
			} else {
				resolve(id);
			}
		}
	});
};

/**
* Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
*
* @param rl	Objeto readline usado para implementar el CLI.
* @param id Clave del quiz a mostrar.
*/
exports.showCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(`  [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Esta función convierte la llamada rl.question, que está basada en callbacks, en una
* basada en promesas.
*
* Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido.
* Entonces la llamada a then que hay que hacer la promesa devuelta será:
*		.then(answer => {...})
*
* También colorea en rojo el texto de la pregunta, elimina los espacios al principio y final.
*
* @param rl Objeto readline usado para implementar el CLI.
* @param text Pregunta que hay que hacerle al usuario.
*/
const makeQuestion = (rl, text) => {
	return new Sequelize.Promise((resolve, reject) => {
		rl.question(colorize(text, 'red'), answer => {
			resolve(answer.trim());
		});
	});
};


/**
* Añade un nuevo quiz al modelo.
* Pregunta interactivamente por la pregunta y por la respuesta.
*
* Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
* El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuarios,
* es decir, la llamada a promt() se debe hacer en el callback de la segunda
* llamada a rl.question.
*
* @param rl	Objeto readline usado para implementar el CLI.
*/
exports.addCmd = rl => {
	makeQuestion(rl, ' Introduzca una pregunta: ')
	.then(q => {
		return makeQuestion(rl, ' Introduzca la respuesta ')
		.then(a => {
			return {question: q, answer: a};
		});
	})
	.then (quiz => {
		return models.quiz.create(quiz);
	})
	.then(quiz => {
		log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Borra un quiz del modelo.
*
* @param rl	Objeto readline usado para implementar el CLI.
* @param id Clave del quiz a borrar en el modelo.
*/
exports.deleteCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.destroy({where: {id}}))
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Edita un quiz del modelo.
*
* Hay que recordar que el funcionamiento de la función rl.question es asíncrono.
* El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuarios,
* es decir, la llamada a promt() se debe hacer en el callback de la segunda
* llamada a rl.question.
*
* @param rl	Objeto readline usado para implementar el CLI.
* @param id Clave del quizz a editar en el modelo.
*/
exports.editCmd = (rl, id) => {

	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
		return makeQuestion(rl, ' Introduzca la pregunta: ')
		.then(q => {
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
			return makeQuestion(rl, ' Introduzca la respuesta: ')
			.then(a => {
				quiz.question = q;
				quiz.answer = a;
				return quiz;
			});
		});
	})
	.then(quiz => {
		return quiz.save();
	})
	.then(quiz => {
		log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	});
};

/**
* Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
*
* @param rl	Objeto readline usado para implementar el CLI.
* @param id Clave del quiz a probar.
*/

exports.testCmd = (rl, id) => {
	validateId(id)
	.then(id => models.quiz.findById(id))
	.then(quiz => {
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		} else {
			return makeQuestion(rl, quiz.question + '? ')
			.then(a => {
				if (quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()){
					log('Su respuesta es correcta.');
					biglog('Correcta', 'green');
					rl.prompt();
				} else {
					log('Su respuesta es incorrecta.');
					biglog('Incorrecta', 'red');
					rl.prompt();
				}
			});
		}
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog('El quiz es erroneo:');
		error.errors.forEach(({message}) => errorlog(message));
	})
	.catch(error => {
		errorlog(error.message);
	})
	.then(() => {
		rl.prompt();
	})
};

/**
* Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
* Se gana si se contesta a todos satisfactoriamente.
*
* @param rl	Objeto readline usado para implementar el CLI.
*/
exports.playCmd = rl => {
	let score = 0;
	let toBeResolved = [];

	models.quiz.findAll()
	.then(quizzes => {
		quizzes.forEach((quiz,id) => {
			toBeResolved[id] = quiz;
		});
	

		const playOne = () => {
			if(toBeResolved.length === 0) {
				log('No hay nada más que preguntar.');
				log('Fin del examen. Aciertos:');
				biglog(score, 'magenta');
				rl.prompt()
			} else {
				let id = Math.round((toBeResolved.length-1)*Math.random());
				let quiz = toBeResolved[id];
				toBeResolved.splice(id,1);
				return makeQuestion(rl, quiz.question + '? ')
				.then(a => {
					if (quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()){
						score++;
						log(`CORRECTO - Lleva ${score} aciertos.`);
						playOne();
						rl.prompt();
					} else {
						log(`INCORRECTO.`);
						log(`Fin del examen. Aciertos:`)
						biglog(score, 'magenta');
						rl.prompt();
					}
				})
				.catch(Sequelize.ValidationError, error => {
					errorlog('El quiz es erroneo:');
					error.errors.forEach(({message}) => errorlog(message));
				})
				.catch(error => {
				errorlog(error.message);
				});
			}
		};
		playOne();
	});
};

/**
* Muestra los nombres de los autores de la práctica.
*
* @param rl	Objeto readline usado para implementar el CLI.
*/
exports.creditsCmd = rl => {
	log('Autor de la práctica:');
	log('ALBERTO', 'green');
	rl.prompt();
};

/**
* Terminar el programa.
*
* @param rl	Objeto readline usado para implementar el CLI.
*/
exports.quitCmd = rl => {
	rl.close();
};