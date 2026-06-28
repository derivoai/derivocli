import readline from 'readline';

// The readline interface is created lazily on first use. Creating it at module
// load opens a handle on process.stdin, which keeps the process (and any test
// runner that imports this module transitively) alive indefinitely.
let rl: readline.Interface | null = null;

function getInterface(): readline.Interface {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

export function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    getInterface().question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

export async function promptSelect(question: string, options: string[]): Promise<string> {
  console.log(`\n${question}`);
  options.forEach((opt, i) => {
    console.log(`  ${i + 1}. ${opt}`);
  });

  while (true) {
    const answer = await prompt(`\nSelect (1-${options.length}): `);
    const index = parseInt(answer, 10) - 1;
    if (index >= 0 && index < options.length) {
      return options[index]!;
    }
    console.log('  Invalid selection. Please try again.');
  }
}

export async function promptConfirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const answer = await prompt(`${question} (${hint}): `);
  if (answer === '') return defaultYes;
  return answer.toLowerCase().startsWith('y');
}

export function closePrompt() {
  if (rl) {
    rl.close();
    rl = null;
  }
}
