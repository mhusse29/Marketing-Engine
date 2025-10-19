/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Structured Response Component
 * Renders validated JSON responses from Badu in a professional, structured format
 */

import { Check, ChevronRight, Info, AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '../lib/format';
import { CopyButton } from './CopyButton';

interface StructuredResponseProps {
  response: any;
  type: string;
}

export function StructuredResponse({ response, type }: StructuredResponseProps) {
  if (!response || typeof response !== 'object') {
    return <div className="text-white/60 text-sm">Invalid response format</div>;
  }

  switch (type) {
    case 'help':
      return <HelpResponse {...response} />;
    case 'comparison':
      return <ComparisonResponse {...response} />;
    case 'comparison_table':
      return <ComparisonTableResponse {...response} />;
    case 'categorized_settings':
      return <CategorizedSettingsResponse {...response} />;
    case 'decision_tree':
      return <DecisionTreeResponse {...response} />;
    case 'workflow':
      return <WorkflowResponse {...response} />;
    case 'settings_guide':
      return <SettingsGuideResponse {...response} />;
    case 'troubleshooting':
      return <TroubleshootingResponse {...response} />;
    case 'error':
      return <ErrorResponse {...response} />;
    default:
      return <HelpResponse {...response} />;
  }
}

// Callout Box Component (reusable)
function CalloutBox({ type, message }: { type: 'tip' | 'warning' | 'info' | 'success'; message: string }) {
  const styles = {
    tip: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: '💡',
    },
    warning: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      icon: 'ℹ️',
    },
    success: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      icon: '✅',
    },
  };

  const style = styles[type] || styles.info;

  return (
    <div className={cn('rounded-lg border p-3', style.bg, style.border)}>
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{style.icon}</span>
        <div className="flex-1">
          <div className={cn('text-[11px] font-medium uppercase tracking-wide mb-1', style.text)}>
            {type === 'tip' ? 'Pro Tip' : type === 'warning' ? 'Important' : type === 'success' ? 'Success' : 'Info'}
          </div>
          <p className="text-[13px] text-white/85">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Comparison Table Response Component (NEW - Feature-by-feature table)
function ComparisonTableResponse({ title, brief, table, recommendation, callout, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-indigo-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Comparison Table */}
      {table && table.headers && table.rows && (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          {/* Table Header */}
          <div className="grid gap-px bg-white/5" style={{ gridTemplateColumns: `1.5fr repeat(${table.headers.length - 1}, 1fr)` }}>
            {table.headers.map((header: string, index: number) => (
              <div
                key={index}
                className={cn(
                  'bg-[#1a1a1a] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide',
                  index === 0 ? 'text-white/70' : 'text-white/85 text-center'
                )}
              >
                {header}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/5">
            {table.rows.map((row: any, rowIndex: number) => (
              <div
                key={rowIndex}
                className="grid gap-px bg-white/5"
                style={{ gridTemplateColumns: `1.5fr repeat(${table.headers.length - 1}, 1fr)` }}
              >
                {/* Feature Name */}
                <div className="bg-[#1a1a1a] px-3 py-2.5 text-[13px] font-medium text-white/95">
                  {row.feature}
                </div>
                {/* Values */}
                {row.values.map((value: string, valueIndex: number) => (
                  <div
                    key={valueIndex}
                    className="bg-[#1a1a1a] px-3 py-2.5 text-[13px] text-white/80 text-center"
                  >
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/30 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wide">
                Recommendation
              </div>
              <p className="text-[13px] text-white/85">{recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Callout */}
      {callout && callout.type && callout.message && (
        <CalloutBox type={callout.type} message={callout.message} />
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Categorized Settings Response Component (NEW - Settings organized by category with icons)
function CategorizedSettingsResponse({ title, brief, categories, callout, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-violet-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="space-y-3">
          {categories.map((category: any, catIndex: number) => (
            <div
              key={catIndex}
              className="rounded-lg bg-white/3 border border-white/8 p-3.5 space-y-3"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  <h3 className="text-sm font-semibold text-white/95">{category.category_name}</h3>
                </div>
                {category.count && (
                  <span className="text-[11px] font-medium text-white/50 bg-white/5 px-2 py-0.5 rounded">
                    {category.count} setting{category.count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Settings in Category */}
              {category.settings && category.settings.length > 0 && (
                <div className="space-y-2">
                  {category.settings.map((setting: any, settingIndex: number) => (
                    <div key={settingIndex} className="group flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-medium text-white/90">{setting.name}</span>
                        <div className="flex items-center gap-2">
                          <code className="text-[11px] text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded whitespace-nowrap">
                            {setting.options}
                          </code>
                          <CopyButton text={setting.options} label="Copy" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {setting.tip && (
                        <span className="text-[12px] text-white/60 italic">{setting.tip}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Callout */}
      {callout && callout.type && callout.message && (
        <CalloutBox type={callout.type} message={callout.message} />
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Decision Tree Response Component (NEW - "Which should I choose" with branches)
function DecisionTreeResponse({ title, brief, decision_question, branches, callout, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-emerald-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Decision Question */}
      {decision_question && (
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide mb-1">
            Decision Guide
          </div>
          <p className="text-[13px] font-medium text-white/90">{decision_question}</p>
        </div>
      )}

      {/* Decision Branches */}
      {branches && branches.length > 0 && (
        <div className="space-y-2.5">
          {branches.map((branch: any, index: number) => (
            <div
              key={index}
              className="rounded-lg bg-white/3 border border-white/8 p-3 hover:bg-white/5 transition-colors"
            >
              <div className="flex gap-3">
                {/* Icon */}
                {branch.icon && (
                  <div className="flex-shrink-0 text-xl mt-0.5">
                    {branch.icon}
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 space-y-1.5">
                  {/* Condition */}
                  <div className="text-[12px] text-white/60 italic">
                    {branch.condition}
                  </div>
                  
                  {/* Recommendation */}
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-400">
                      {branch.recommendation}
                    </span>
                  </div>
                  
                  {/* Reason */}
                  <div className="text-[13px] text-white/75 pl-5">
                    {branch.reason}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Callout */}
      {callout && callout.type && callout.message && (
        <CalloutBox type={callout.type} message={callout.message} />
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Help Response Component
function HelpResponse({ title, brief, bullets, next_steps, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-blue-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Bullets */}
      {bullets && bullets.length > 0 && (
        <div className="space-y-2">
          {bullets.map((bullet: string, index: number) => (
            <div key={index} className="flex gap-2.5 items-start">
              <Check className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-white/85">{bullet}</span>
            </div>
          ))}
        </div>
      )}

      {/* Next Steps */}
      {next_steps && next_steps.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400 uppercase tracking-wide">
            <ChevronRight className="h-3.5 w-3.5" />
            Next Steps
          </div>
          <div className="space-y-1.5">
            {next_steps.map((step: string, index: number) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="text-[11px] text-white/40 font-medium mt-0.5">{index + 1}.</span>
                <span className="text-[13px] text-white/85">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Comparison Response Component
function ComparisonResponse({ title, brief, comparisons, recommendation, callout, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-purple-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Comparisons */}
      {comparisons && comparisons.length > 0 && (
        <div className="space-y-3">
          {comparisons.map((item: any, index: number) => (
            <div
              key={index}
              className="rounded-lg bg-white/3 border border-white/8 p-3 space-y-2.5"
            >
              <h3 className="text-sm font-medium text-white/95">{item.name}</h3>
              
              {/* Pros */}
              {item.pros && item.pros.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide">
                    Strengths
                  </div>
                  {item.pros.map((pro: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-emerald-400 text-[13px]">✓</span>
                      <span className="text-[13px] text-white/80">{pro}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Cons */}
              {item.cons && item.cons.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wide">
                    Limitations
                  </div>
                  {item.cons.map((con: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-amber-400 text-[13px]">•</span>
                      <span className="text-[13px] text-white/70">{con}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Best For */}
              {item.best_for && item.best_for.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wide">
                    Best For
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.best_for.map((use: string, i: number) => (
                      <span
                        key={i}
                        className="text-[11px] text-white/80 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded"
                      >
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wide">
                Recommendation
              </div>
              <p className="text-[13px] text-white/85">{recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Callout */}
      {callout && callout.type && callout.message && (
        <CalloutBox type={callout.type} message={callout.message} />
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Workflow Response Component
function WorkflowResponse({ title, brief, steps, tips, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-emerald-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <div className="space-y-3">
          {steps.map((step: any, index: number) => (
            <div
              key={index}
              className="flex gap-3 items-start"
            >
              {/* Step Number */}
              <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-[11px] font-semibold text-emerald-400">
                  {step.step_number}
                </span>
              </div>
              
              {/* Step Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-medium text-white/50 uppercase tracking-wide">
                    {step.panel}
                  </span>
                </div>
                <div className="text-sm font-medium text-white/95 mb-0.5">
                  {step.action}
                </div>
                <div className="text-[13px] text-white/70">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-2">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wide">
            Pro Tips
          </div>
          <div className="space-y-1.5">
            {tips.map((tip: string, index: number) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="text-amber-400 text-[13px]">💡</span>
                <span className="text-[13px] text-white/85">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Guide Response Component
function SettingsGuideResponse({ title, brief, panel, settings, basic_settings, advanced_settings, best_practices, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-cyan-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Brief */}
      <p className="text-[13px] leading-relaxed text-white/80">{brief}</p>

      {/* Panel Badge */}
      {panel && (
        <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded text-[11px] font-medium text-cyan-400 uppercase tracking-wide">
          <span>Panel:</span>
          <span>{panel}</span>
        </div>
      )}

      {/* Settings (includes prompt + model recommendation) */}
      {settings && settings.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide">
            Prompt & Model
          </div>
          <div className="space-y-2">
            {settings.map((setting: any, index: number) => {
              // Check if this is a prompt (long text or has "prompt" in name)
              const isPrompt = setting.name?.toLowerCase().includes('prompt') || setting.value?.length > 100;
              
              return (
                <div
                  key={index}
                  className="rounded-lg bg-white/3 border border-white/8 p-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-sm font-medium text-white/95">{setting.name}</span>
                    {isPrompt && <CopyButton text={setting.value} label="Copy Prompt" />}
                  </div>
                  {isPrompt ? (
                    // For prompts: Always show full text
                    <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap mb-2">{setting.value}</p>
                  ) : (
                    // For model recommendation: Show as badge
                    <div className="text-[13px] text-emerald-300 font-mono mb-2">{setting.value}</div>
                  )}
                  {setting.explanation && (
                    <p className="text-[12px] text-white/60 leading-relaxed">{setting.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Basic Settings (new format) */}
      {basic_settings && basic_settings.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-medium text-cyan-400 uppercase tracking-wide">
            Basic Settings
          </div>
          <div className="space-y-2">
            {basic_settings.map((setting: any, index: number) => {
              const isPrompt = setting.name?.toLowerCase().includes('prompt') || setting.value?.length > 100;
              
              return (
                <div
                  key={index}
                  className="rounded-lg bg-white/3 border border-white/8 p-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <span className="text-sm font-medium text-white/95">{setting.name}</span>
                    {isPrompt && <CopyButton text={setting.value} label="Copy" />}
                  </div>
                  <div className="text-[13px] text-cyan-300 font-mono mb-2">{setting.value}</div>
                  {setting.explanation && (
                    <p className="text-[12px] text-white/60 leading-relaxed">{setting.explanation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Settings (new format) */}
      {advanced_settings && advanced_settings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-medium text-purple-400 uppercase tracking-wide">
              Advanced Settings
            </div>
            <div className="flex-1 h-px bg-purple-500/20"></div>
          </div>
          <div className="space-y-2">
            {advanced_settings.map((setting: any, index: number) => (
              <div
                key={index}
                className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="text-sm font-medium text-white/95">{setting.name}</span>
                </div>
                <div className="text-[13px] text-purple-300 font-mono mb-2">{setting.value}</div>
                {setting.explanation && (
                  <p className="text-[12px] text-white/60 leading-relaxed">{setting.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      {best_practices && best_practices.length > 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
          <div className="text-[11px] font-medium text-white/60 uppercase tracking-wide">
            Best Practices
          </div>
          <div className="space-y-1.5">
            {best_practices.map((practice: string, index: number) => (
              <div key={index} className="flex gap-2 items-start">
                <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-[13px] text-white/80">{practice}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Troubleshooting Response Component
function TroubleshootingResponse({ title, problem, causes, solutions, sources }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      {/* Title */}
      <div className="border-l-2 border-red-500/50 pl-3">
        <h2 className="text-base font-semibold text-white/95">{title}</h2>
      </div>

      {/* Problem */}
      {problem && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[11px] font-medium text-red-400 uppercase tracking-wide mb-1">
                Problem
              </div>
              <p className="text-[13px] text-white/85">{problem}</p>
            </div>
          </div>
        </div>
      )}

      {/* Causes */}
      {causes && causes.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-medium text-white/60 uppercase tracking-wide">
            Common Causes
          </div>
          {causes.map((cause: string, index: number) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="text-amber-400 text-[13px]">•</span>
              <span className="text-[13px] text-white/80">{cause}</span>
            </div>
          ))}
        </div>
      )}

      {/* Solutions */}
      {solutions && solutions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wide">
            Solutions
          </div>
          {solutions.map((item: any, index: number) => (
            <div
              key={index}
              className="rounded-lg bg-white/3 border border-white/8 p-3 space-y-2"
            >
              <div className="text-sm font-medium text-white/95">{item.solution}</div>
              {item.steps && item.steps.length > 0 && (
                <div className="space-y-1">
                  {item.steps.map((step: string, i: number) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-[11px] text-white/40 font-medium mt-0.5">{i + 1}.</span>
                      <span className="text-[13px] text-white/75">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <BookOpen className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] text-white/40 uppercase tracking-wide">Sources:</span>
          {sources.map((source: string, index: number) => (
            <span
              key={index}
              className="text-[11px] text-white/60 bg-white/5 px-2 py-0.5 rounded"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Error Response Component
function ErrorResponse({ title, message, next_steps }: any) {
  return (
    <div className="badu-structured-response space-y-4">
      <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-white/95">{title}</div>
            <p className="text-[13px] text-white/80">{message}</p>
          </div>
        </div>
      </div>

      {next_steps && next_steps.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-white/60 uppercase tracking-wide">
            What to Try
          </div>
          {next_steps.map((step: string, index: number) => (
            <div key={index} className="flex gap-2 items-start">
              <ChevronRight className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-white/80">{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

