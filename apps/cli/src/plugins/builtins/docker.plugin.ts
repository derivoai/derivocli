/**
 * Built-in example plugin: Docker
 */
import type { DerivoPlugin, PluginManifest } from '../plugin-types/index.js';

export const manifest: PluginManifest = {
  id: 'docker',
  name: 'Docker Plugin',
  version: '1.0.0',
  description: 'Detects Docker configuration and flags manual setup.',
  author: 'Derivo',
  apiVersion: '1',
  permissions: ['filesystem'],
};

export const plugin: DerivoPlugin = {
  id: 'docker',

  detect(ctx) {
    const applies = ctx.analysis.docker.used;
    return {
      applies,
      findings: applies ? [{ level: 'success', message: 'Docker configuration detected' }] : [],
      data: { files: ctx.analysis.docker.files },
    };
  },

  doctor(ctx) {
    if (!ctx.analysis.docker.used) return { applies: false };
    return {
      applies: true,
      findings: [
        {
          level: 'info',
          message: 'Docker is required to run this project',
          detail: ctx.analysis.docker.hasCompose ? 'docker compose services detected' : undefined,
        },
      ],
    };
  },

  validate(ctx) {
    if (!ctx.analysis.docker.used) return { applies: false };
    const findings = [];
    if (ctx.analysis.docker.hasDockerfile && !ctx.fs.exists('.dockerignore')) {
      findings.push({
        level: 'warning' as const,
        message: 'Dockerfile present but no .dockerignore',
      });
    }
    return {
      applies: true,
      findings,
      recommendations: findings.length ? ['Add a .dockerignore to keep images small'] : [],
    };
  },

  inspect(ctx) {
    if (!ctx.analysis.docker.used) return { applies: false };
    return {
      applies: true,
      findings: [
        { level: 'info', message: `Docker files: ${ctx.analysis.docker.files.join(', ')}` },
      ],
      data: { files: ctx.analysis.docker.files, compose: ctx.analysis.docker.hasCompose },
    };
  },

  setup(ctx) {
    if (!ctx.analysis.docker.used) return { applies: false };
    return {
      applies: true,
      recommendations: ctx.analysis.docker.hasCompose
        ? ['Run "docker compose up -d" to start required services (manual step)']
        : ['Build the Docker image before running (manual step)'],
    };
  },
};
