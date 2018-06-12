//QUIZ
const readline = require('readline');

// Importo las funciones a medida que las necesito.
const {log, biglog, errorlog, colorize} = require('./out');

const cmds = require('./cmds');

// Mensaje inicial
biglog('CORE Quiz', 'green');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: colorize("quiz > ", 'blue'),
	completer: (line) => {
		const completions = 'h help add delete list test p play credits q quit'.split(' ');
		const hits = completions.filter((c) => c.startsWith(line));
		// show all completions if none found
		return [hits.length ? hits : completions, line];
	}
});

rl.prompt();

rl
.on('line', (line) => {
	// Cojo la línea y la parto por un especio en blanco.
	let args = line.split(" ");
	// Cojo el comando y lo pongo en minúsculas
	let cmd = args[0].toLowerCase().trim();

	switch (cmd) {
		case '':
			rl.prompt(rl);
			break;

		case 'h':
		case 'help':
			cmds.helpCmd(rl);
			break;

		case 'quit':
		case 'q':
			cmds.quitCmd(rl);
			break

		case 'add':
			cmds.addCmd(rl);
			break;

		case 'list':
			cmds.listCmd(rl);
			break;

		case 'show':
			cmds.showCmd(rl, args[1]);
			break;

		case 'test':
			cmds.testCmd(rl, args[1]);
			break;

		case 'play':
		case 'p':
			cmds.playCmd(rl);
			break;

		case 'delete':
			cmds.deleteCmd(rl, args[1]);
			break;

		case 'edit':
			cmds.editCmd(rl, args[1]);
			break;

		case 'credits':
			cmds.creditsCmd(rl);
			break;

		default:
			log(`Comando desconocido: '${colorize(cmd, 'red')}'`);
			log(`Use ${colorize('help', 'green')} para ver todos los comandos disponibles.`);
			rl.prompt();
			break;
	}
	/** rl.prompt(); */
})
.on('close', () => {
	log('Adios!');
	process.exit(0);
});