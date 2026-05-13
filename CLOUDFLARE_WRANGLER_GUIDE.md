# Cloudflare Wrangler Configuration Guide

The provided documentation outlines how to configure and use Cloudflare's Wrangler tool for
developing and deploying Cloudflare Workers applications, including handling various configurations
and settings.

## Basic Configuration

- **Wrangler Configuration File**: Typically `wrangler.toml` or `wrangler.jsonc`.
- **Environments**: Can specify different configurations for different environments (e.g., `staging`
  and `production`).
- **Secrets Management**: Use `.dev.vars` or `.env` files for local development secrets, and
  configure them not to be committed to version control.

## Advanced Configuration

- **Local Development Settings**: Customize the local development server's IP, port, protocol, and
  more.
- **Secrets**: Securely store and manage sensitive information using encrypted secrets.
- **Bundling**: Control how Wrangler bundles your Worker's code and dependencies.
- **Python Workers**: Special configurations for Python-based Workers.
- **Custom Instance Types**: Define custom resource configurations for containers.
- **Source Maps**: Enable automatic generation and upload of source maps for better debugging.

## Specific Features

- **Alias Module Resolution**: Replace default module imports with custom implementations.
- **Workers Sites**: Hosting static and dynamic websites. Note: deprecated for new projects.
- **Proxy Support**: Configure Wrangler to work through corporate network proxies.

## Recommended Practices

- **Keep Wrangler as Source of Truth**: Avoid making changes directly in the Cloudflare dashboard if
  possible.
- **Avoid Committing Secrets**: Manage secrets locally and exclude them from version control.
- **Generated Configurations**: Understand how build tools may generate and redirect Wrangler
  configurations for deployment.

## Examples

- **Secrets Example**:
  - `.dev.vars`/`.env` files for local development secrets.
- **Local Development**:
  - Configure IP, port, protocol for local development.
- **Custom Instance Types**:
  - Define custom vCPU, memory, and disk configurations for containers.

## Best Practices

- **Keep Wrangler Config Up-to-Date**: Use the dashboard to generate TOML snippets for
  configurations that need updating.
- **Use Environment Variables for Secrets**: Securely manage secrets using environment variables.
- **Generate Configurations**: Use build tools to generate configurations specifically for each
  deployment environment.

## Conclusion

The documentation provides a comprehensive guide to configuring and managing Cloudflare Workers
projects using Wrangler, covering everything from basic setup to advanced features like custom
instance types and proxy support.
