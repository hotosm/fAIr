{{/*
Expand the name of the chart.
*/}}
{{- define "fair.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "fair.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "fair.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "fair.labels" -}}
helm.sh/chart: {{ include "fair.chart" . }}
{{ include "fair.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "fair.selectorLabels" -}}
app.kubernetes.io/name: {{ include "fair.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "fair.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "fair.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Backend fullname
*/}}
{{- define "fair.backend.fullname" -}}
{{- printf "%s-backend" (include "fair.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "fair.backend.selectorLabels" -}}
{{ include "fair.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend image
*/}}
{{- define "fair.backend.image" -}}
{{- $tag := default .Chart.AppVersion .Values.image.backend.tag -}}
{{- printf "%s:%s" .Values.image.backend.repository $tag }}
{{- end }}

{{/*
DATABASE_URL for Django (external database path).
*/}}
{{- define "fair.databaseUrl" -}}
postgis://$(DATABASE_USER):$(DATABASE_PASSWORD)@{{ .Values.externalDatabase.host }}:{{ .Values.externalDatabase.port | toString }}/{{ .Values.externalDatabase.database }}
{{- end }}

{{/*
Name of the bundled Postgres resources (Service, StatefulSet, Secret).
*/}}
{{- define "fair.postgresName" -}}
{{ include "fair.fullname" . }}-postgres
{{- end }}

{{/*
DATABASE_URL env entry sourced from the chart-managed Postgres Secret.
Included in the backend Deployment and migration Job when
postgres.enabled=true so it overrides any DATABASE_URL / DATABASE_PASSWORD
that would otherwise come from `externalDatabase`.
*/}}
{{- define "fair.postgresDatabaseUrlEnv" -}}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "fair.postgresName" . }}
      key: DATABASE_URL
{{- end }}

{{/* Argo CD sync wave; ignored by Helm. */}}
{{- define "fair.syncWave" -}}
argocd.argoproj.io/sync-wave: {{ . | quote }}
{{- end }}

{{/* Migration Job name with a revision-preserving suffix. */}}
{{- define "fair.migrateJobName" -}}
{{- $suffix := printf "-migrate-%d" (.Release.Revision | int) -}}
{{- printf "%s%s" (include "fair.backend.fullname" . | trunc (int (sub 63 (len $suffix))) | trimSuffix "-") $suffix -}}
{{- end }}
