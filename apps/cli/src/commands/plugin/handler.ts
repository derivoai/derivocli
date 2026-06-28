/**
 * `derivo plugin <subcommand>` handlers.
 *
 * Thin layer that builds a PluginRuntime, initializes it (loading built-in and
 * local plugins), and delegates to the plugin-cli presentation functions.
 */
import { PluginRuntime } from '../../plugins/index.js';
import {
  doDisable,
  doEnable,
  doReload,
  renderDoctor,
  renderInfo,
  renderList,
} from '../../plugins/plugin-cli/index.js';
import { CommandReporter, renderError } from '../../utils/cli-runtime.js';
import { printBanner, icons } from '../../utils/ui.js';

export type PluginSubcommand = 'list' | 'info' | 'enable' | 'disable' | 'reload' | 'doctor';

export interface PluginCommandOptions {
  json: boolean;
  verbose: boolean;
}

export async function pluginHandler(
  sub: PluginSubcommand,
  id: string | undefined,
  options: PluginCommandOptions,
): Promise<void> {
  const reporter = new CommandReporter(options);

  if (!options.json) {
    printBanner('Derivo Plugins', `${icons.gear} Extensible CLI platform`);
  }

  const runtime = new PluginRuntime({ verbose: options.verbose });

  let report;
  try {
    report = await runtime.init();
  } catch (error) {
    renderError(error, options.json);
    process.exit(1);
  }

  reporter.setPluginsLoaded(report.loaded.length);
  for (const f of report.failed) reporter.recordError();

  let exitCode = 0;
  try {
    switch (sub) {
      case 'list':
        renderList(runtime, report, options);
        break;
      case 'info':
        if (!id) throw new Error('Usage: derivo plugin info <id>');
        if (!renderInfo(runtime, id, options)) exitCode = 1;
        break;
      case 'enable':
        if (!id) throw new Error('Usage: derivo plugin enable <id>');
        if (!(await doEnable(runtime, id, options))) exitCode = 1;
        break;
      case 'disable':
        if (!id) throw new Error('Usage: derivo plugin disable <id>');
        if (!(await doDisable(runtime, id, options))) exitCode = 1;
        break;
      case 'reload':
        if (!id) throw new Error('Usage: derivo plugin reload <id>');
        if (!(await doReload(runtime, id, options))) exitCode = 1;
        break;
      case 'doctor':
        renderDoctor(runtime, report, options);
        break;
    }
  } catch (error) {
    renderError(error, options.json);
    exitCode = 1;
  }

  reporter.printFooter();
  process.exit(exitCode);
}
