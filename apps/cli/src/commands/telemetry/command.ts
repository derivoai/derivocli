import { Command } from 'commander';
import pc from 'picocolors';
import { getTelemetryStatus, setTelemetryEnabled } from '../../utils/telemetry.js';
import { icons } from '../../utils/ui.js';

export const telemetryCommand = new Command('telemetry').description(
  'Manage anonymous usage telemetry (off by default, opt-in)',
);

telemetryCommand
  .command('status')
  .description('Show telemetry status')
  .option('--json', 'Output as JSON')
  .action((options: { json?: boolean }) => {
    const status = getTelemetryStatus();
    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }
    const state = status.enabled ? pc.green('enabled') : pc.dim('disabled (default)');
    console.log(`  ${icons.info} Telemetry is ${state}`);
    if (status.enabled) console.log(`    ${pc.dim('Local queue:')} ${status.queuePath}`);
  });

telemetryCommand
  .command('enable')
  .description('Opt in to anonymous usage telemetry')
  .action(() => {
    setTelemetryEnabled(true);
    console.log(
      `  ${pc.green(icons.success)} Telemetry enabled. Thank you for helping improve Derivo.`,
    );
    console.log(
      `    ${pc.dim('Events are stored locally only; no transport ships in this build.')}`,
    );
  });

telemetryCommand
  .command('disable')
  .description('Opt out of telemetry')
  .action(() => {
    setTelemetryEnabled(false);
    console.log(`  ${pc.green(icons.success)} Telemetry disabled.`);
  });
