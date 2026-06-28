import { Command } from 'commander';
import pc from 'picocolors';
import { getVersionInfo } from '../../utils/version.js';
import { printBanner, printSection, icons, nl } from '../../utils/ui.js';

export const versionCommand = new Command('version')
  .description('Show CLI, plugin API, and Node compatibility information')
  .option('--json', 'Output version information as JSON')
  .action((options: { json?: boolean }) => {
    const info = getVersionInfo();

    if (options.json) {
      console.log(JSON.stringify(info, null, 2));
      return;
    }

    printBanner('Derivo Version', `${icons.info} Version & compatibility`);
    printSection('Versions');
    kv('CLI', `v${info.cli}`);
    kv('Plugin API', `v${info.pluginApiVersion}`);
    kv('API Compatibility', info.apiCompatibility);

    printSection('Runtime');
    const nodeStatus = info.node.satisfied
      ? pc.green(`${info.node.current} (ok)`)
      : pc.red(`${info.node.current} (requires ${info.node.minimum})`);
    kv('Node.js', nodeStatus);
    kv('Required', info.node.minimum);
    kv('Platform', `${info.platform} (${info.arch})`);
    nl();
  });

function kv(key: string, value: string): void {
  console.log(`    ${pc.dim(key.padEnd(20))} ${pc.white(value)}`);
}
