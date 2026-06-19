import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command: string) {
  try {
    console.log(`Running command: ${command}`);
    const { stdout, stderr } = await execAsync(command);
    if (stdout) {
      console.log('STDOUT:', stdout);
    }
    if (stderr) {
      console.error('STDERR:', stderr);
    }
  } catch (error) {
    console.error('Command failed with error:', error);
  }
}

async function main() {
  await runCommand('npm run start:dev');
}

main();