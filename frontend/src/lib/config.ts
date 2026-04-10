export const runtimeConfig = {
  appName: import.meta.env.VITE_APP_NAME || 'FI Requirements Workbench',
  defaultTemplateId:
    import.meta.env.VITE_DEFAULT_TEMPLATE_ID || 'business-requirements-v1',
  discoveryWebhookUrl:
    import.meta.env.VITE_DISCOVERY_WEBHOOK_URL ||
    '/webhook/discovery-agent',
  revisionWebhookUrl:
    import.meta.env.VITE_REVISION_WEBHOOK_URL || '/webhook/revision-agent',
  sessionExportUrlBase:
    import.meta.env.VITE_SESSION_EXPORT_URL_BASE || '/sessions',
  transcriptionUrl:
    import.meta.env.VITE_TRANSCRIPTION_URL || '/audio/transcriptions',
};
