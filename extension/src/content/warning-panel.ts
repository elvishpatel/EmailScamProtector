import type { AnalysisResult } from '../types/analysis';
import { RiskLevel } from '../types/analysis';

/**
 * Warning panel injected into Gmail's DOM using Shadow DOM for complete style isolation.
 * Displays analysis results as a banner above the email body.
 */
export class WarningPanel {
  private shadowHost: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private dismissed = false;

  /** Show the warning panel with analysis results */
  show(result: AnalysisResult): void {
    this.dismissed = false;
    this.removeExisting();
    this.createPanel();
    this.render(result);
    this.injectIntoGmail();
  }

  /** Hide and remove the panel */
  hide(): void {
    this.removeExisting();
  }

  /** Update the panel with new results */
  update(result: AnalysisResult): void {
    if (this.dismissed) return;
    if (this.shadowRoot) {
      this.render(result);
    } else {
      this.show(result);
    }
  }

  /** Show a loading state */
  showLoading(): void {
    this.dismissed = false;
    this.removeExisting();
    this.createPanel();

    if (this.shadowRoot) {
      const container = this.shadowRoot.getElementById('esp-content');
      if (container) {
        container.innerHTML = `
          <div class="esp-panel esp-loading">
            <div class="esp-spinner"></div>
            <span class="esp-loading-text">Analyzing email for safety...</span>
          </div>
        `;
      }
    }
    this.injectIntoGmail();
  }

  private removeExisting(): void {
    const existing = document.getElementById('esp-warning-host');
    if (existing) existing.remove();
    this.shadowHost = null;
    this.shadowRoot = null;
  }

  private createPanel(): void {
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'esp-warning-host';
    this.shadowHost.style.cssText = 'all: initial; display: block; margin: 0; padding: 0;';
    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = this.getStyles();
    this.shadowRoot.appendChild(style);

    const content = document.createElement('div');
    content.id = 'esp-content';
    this.shadowRoot.appendChild(content);
  }

  private render(result: AnalysisResult): void {
    if (!this.shadowRoot) return;
    const container = this.shadowRoot.getElementById('esp-content');
    if (!container) return;

    const level = result.riskLevel;
    const color = this.getRiskColor(level);
    const icon = this.getRiskIcon(level);
    const label = this.getRiskLabel(level);
    const isHighRisk = level === RiskLevel.HIGH_RISK || level === RiskLevel.DANGEROUS;
    const isSafe = level === RiskLevel.SAFE;
    const mainExplanation = result.explanations[0] ?? 'No specific concerns found.';

    let html = `
      <div class="esp-panel esp-${level.toLowerCase().replace('_', '-')} ${isHighRisk ? 'esp-pulse' : ''}">
        <div class="esp-header">
          <div class="esp-badge" style="background:${color}15;border-color:${color}40;color:${color}">
            <span class="esp-icon">${icon}</span>
            <span class="esp-label">${label}</span>
            <span class="esp-score">(${result.riskScore}/100)</span>
          </div>
          <button class="esp-dismiss" title="Dismiss" aria-label="Dismiss warning">\u2715</button>
        </div>
        <p class="esp-explanation">${this.escapeHtml(mainExplanation)}</p>`;

    if (result.senderVerification.isMismatch) {
      html += `
        <div class="esp-detail-box">
          <strong>\uD83D\uDC64 Sender Concern:</strong> ${this.escapeHtml(result.senderVerification.explanation)}
          <div class="esp-sender-info">
            <span>Shows as: <strong>${this.escapeHtml(result.senderVerification.displayName)}</strong></span>
            <span>Actual: <strong style="color:${color}">${this.escapeHtml(result.senderVerification.actualDomain)}</strong></span>
          </div>
        </div>`;
    }

    if (!isSafe && result.recommendedActions.length > 0) {
      html += `<div class="esp-actions"><strong>What you should do:</strong><ul>`;
      for (const action of result.recommendedActions.slice(0, 3)) {
        html += `<li>${this.escapeHtml(action)}</li>`;
      }
      html += `</ul></div>`;
    }

    if (result.explanations.length > 1 || result.linkAnalysis.suspiciousLinks > 0) {
      html += `<details class="esp-details"><summary>See more details</summary><div class="esp-details-content">`;
      for (const exp of result.explanations.slice(1)) {
        html += `<p class="esp-detail-item">\u2022 ${this.escapeHtml(exp)}</p>`;
      }
      if (result.linkAnalysis.suspiciousLinks > 0) {
        html += `<p class="esp-detail-item"><strong>\uD83D\uDD17 ${result.linkAnalysis.suspiciousLinks} suspicious link(s)</strong></p>`;
      }
      html += `</div></details>`;
    }

    html += `<div class="esp-footer">Analyzed by Email Scam Protector</div></div>`;
    container.innerHTML = html;

    const dismissBtn = this.shadowRoot?.querySelector('.esp-dismiss');
    dismissBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissed = true;
      this.hide();
    });
  }

  private injectIntoGmail(): void {
    if (!this.shadowHost) return;
    const selectors = [
      () => { const b = document.querySelector('div.a3s.aiL') ?? document.querySelector('div.a3s'); return b?.parentElement ?? null; },
      () => document.querySelector('div.adn.ads'),
      () => document.querySelector('div[role="main"] div.nH'),
    ];
    for (const sel of selectors) {
      try {
        const target = sel();
        if (target) { target.insertBefore(this.shadowHost, target.firstChild); return; }
      } catch { continue; }
    }
    console.error('[ESP] Could not find Gmail injection point');
  }

  private escapeHtml(text: string): string {
    const d = document.createElement('div'); d.textContent = text; return d.innerHTML;
  }
  private getRiskColor(l: RiskLevel): string {
    return { [RiskLevel.SAFE]:'#22C55E',[RiskLevel.LOW_RISK]:'#3B82F6',[RiskLevel.SUSPICIOUS]:'#F59E0B',[RiskLevel.HIGH_RISK]:'#EF4444',[RiskLevel.DANGEROUS]:'#DC2626' }[l];
  }
  private getRiskIcon(l: RiskLevel): string {
    return { [RiskLevel.SAFE]:'\u2705',[RiskLevel.LOW_RISK]:'\u2139\uFE0F',[RiskLevel.SUSPICIOUS]:'\u26A0\uFE0F',[RiskLevel.HIGH_RISK]:'\uD83D\uDEA8',[RiskLevel.DANGEROUS]:'\uD83D\uDED1' }[l];
  }
  private getRiskLabel(l: RiskLevel): string {
    return { [RiskLevel.SAFE]:'Safe',[RiskLevel.LOW_RISK]:'Low Risk',[RiskLevel.SUSPICIOUS]:'Suspicious',[RiskLevel.HIGH_RISK]:'High Risk',[RiskLevel.DANGEROUS]:'DANGEROUS' }[l];
  }

  private getStyles(): string {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      .esp-panel{font-family:'Nunito',system-ui,sans-serif;border-radius:12px;padding:16px 20px;margin:8px 0 16px;border-left:5px solid #E5E7EB;background:#F9FAFB;animation:espSlideDown .35s cubic-bezier(.16,1,.3,1);line-height:1.5;color:#1F2937;font-size:15px}
      @keyframes espSlideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
      @keyframes espPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.2)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0)}}
      @keyframes espSpin{to{transform:rotate(360deg)}}
      .esp-pulse{animation:espSlideDown .35s ease,espPulse 2s ease-in-out infinite}
      .esp-safe{border-left-color:#22C55E;background:#F0FDF4}
      .esp-low-risk{border-left-color:#3B82F6;background:#EFF6FF}
      .esp-suspicious{border-left-color:#F59E0B;background:#FFFBEB}
      .esp-high-risk{border-left-color:#EF4444;background:#FEF2F2}
      .esp-dangerous{border-left-color:#DC2626;background:#FEF2F2;border-width:6px}
      .esp-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
      .esp-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-weight:700;font-size:13px;border:1.5px solid}
      .esp-icon{font-size:16px}.esp-score{opacity:.6;font-weight:600;font-size:12px}
      .esp-dismiss{background:none;border:none;cursor:pointer;font-size:18px;color:#9CA3AF;padding:4px 8px;border-radius:6px;transition:all .15s;line-height:1}
      .esp-dismiss:hover{background:rgba(0,0,0,.05);color:#6B7280}
      .esp-explanation{font-size:15px;line-height:1.6;color:#374151;margin-bottom:12px}
      .esp-detail-box{padding:10px 14px;border-radius:8px;background:rgba(0,0,0,.03);margin-bottom:10px;font-size:13px}
      .esp-sender-info{display:flex;flex-direction:column;gap:2px;margin-top:6px;font-size:12px;font-family:monospace;color:#6B7280}
      .esp-actions{margin:10px 0;font-size:14px}
      .esp-actions ul{list-style:none;padding:0;margin-top:6px}
      .esp-actions li{padding:6px 0 6px 24px;position:relative}
      .esp-actions li::before{content:'\uD83D\uDEE1\uFE0F';position:absolute;left:0;top:6px;font-size:14px}
      .esp-details{margin-top:8px}
      .esp-details summary{cursor:pointer;font-weight:600;font-size:13px;color:#3B82F6;user-select:none;padding:4px 0}
      .esp-details summary:hover{text-decoration:underline}
      .esp-details-content{padding:8px 0 4px 12px;border-left:2px solid #E5E7EB;margin-top:6px}
      .esp-detail-item{font-size:13px;color:#6B7280;margin-bottom:4px;line-height:1.5}
      .esp-footer{margin-top:12px;font-size:11px;color:#9CA3AF;text-align:right}
      .esp-loading{display:flex;align-items:center;gap:12px;border-left-color:#3B82F6;background:#EFF6FF}
      .esp-spinner{width:20px;height:20px;border:2.5px solid #DBEAFE;border-top-color:#3B82F6;border-radius:50%;animation:espSpin .8s linear infinite;flex-shrink:0}
      .esp-loading-text{font-weight:600;color:#1E40AF;font-size:14px}
    `;
  }
}
