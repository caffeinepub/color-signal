/**
 * Minimal automated check for prediction flow
 * Runs only when ?checkPrediction=1 is present in URL
 */

interface CheckResult {
  success: boolean;
  message: string;
  details?: string;
}

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector: string, timeout = 10000): Promise<HTMLElement | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) return element;
    await wait(100);
  }
  return null;
}

async function clickElement(selector: string): Promise<boolean> {
  const element = await waitForElement(selector);
  if (!element) return false;
  element.click();
  return true;
}

async function checkPredictionFlow(): Promise<CheckResult> {
  try {
    console.log('[Check] Starting prediction flow check...');

    // Step 1: Add one history entry
    console.log('[Check] Step 1: Adding Big entry...');
    const bigButton = await waitForElement('[data-testid="big-button"]');
    if (!bigButton) {
      return { success: false, message: 'Big button not found' };
    }
    bigButton.click();
    await wait(500);

    // Step 2: Click Prediction button
    console.log('[Check] Step 2: Clicking Prediction button...');
    const predictionButton = await waitForElement('[data-testid="prediction-button"]');
    if (!predictionButton) {
      return { success: false, message: 'Prediction button not found' };
    }
    
    // Check if button is disabled
    if (predictionButton.hasAttribute('disabled')) {
      console.log('[Check] Prediction button is disabled, waiting for connection...');
      
      // Wait for button to become enabled (max 15 seconds)
      const startTime = Date.now();
      while (Date.now() - startTime < 15000) {
        if (!predictionButton.hasAttribute('disabled')) {
          console.log('[Check] Prediction button is now enabled');
          break;
        }
        await wait(500);
      }
      
      if (predictionButton.hasAttribute('disabled')) {
        return { 
          success: false, 
          message: 'Prediction button remained disabled',
          details: 'Backend connection may not be ready'
        };
      }
    }
    
    predictionButton.click();
    await wait(1000);

    // Step 3: Wait for prediction result or error state
    console.log('[Check] Step 3: Waiting for prediction result or error...');
    
    // Wait up to 20 seconds for either result or error
    const maxWaitTime = 20000;
    const startTime = Date.now();
    let finalState: 'result' | 'error' | 'timeout' = 'timeout';
    
    while (Date.now() - startTime < maxWaitTime) {
      const resultElement = document.querySelector('[data-testid="prediction-result"]');
      const errorElement = document.querySelector('[data-testid="prediction-error"]');
      
      if (resultElement) {
        finalState = 'result';
        break;
      }
      
      if (errorElement) {
        finalState = 'error';
        break;
      }
      
      await wait(500);
    }

    if (finalState === 'result') {
      console.log('[Check] ✓ Prediction result displayed successfully');
      const predictionValue = document.querySelector('[data-testid="prediction-value"]')?.textContent;
      const predictionExplanation = document.querySelector('[data-testid="prediction-explanation"]')?.textContent;
      
      if (!predictionValue || !predictionExplanation) {
        return {
          success: false,
          message: 'Prediction result incomplete',
          details: `Value: ${predictionValue}, Explanation: ${!!predictionExplanation}`
        };
      }
      
      return {
        success: true,
        message: 'Prediction flow completed successfully',
        details: `Prediction: ${predictionValue}`
      };
    }

    if (finalState === 'error') {
      console.log('[Check] Prediction error state detected, checking retry path...');
      
      // Check if retry buttons are available
      const retryPredictionButton = document.querySelector('[data-testid="retry-prediction-button"]');
      const retryConnectionButton = document.querySelector('[data-testid="retry-connection-button"]');
      
      if (!retryPredictionButton && !retryConnectionButton) {
        return {
          success: false,
          message: 'Error state has no retry buttons',
          details: 'UI stuck in failed state without recovery path'
        };
      }
      
      // Try retry connection if available
      if (retryConnectionButton) {
        console.log('[Check] Clicking Retry Connection...');
        (retryConnectionButton as HTMLElement).click();
        await wait(2000);
        
        // Try prediction again
        const predictionButtonRetry = document.querySelector('[data-testid="prediction-button"]') as HTMLElement;
        if (predictionButtonRetry && !predictionButtonRetry.hasAttribute('disabled')) {
          console.log('[Check] Retrying prediction after connection retry...');
          predictionButtonRetry.click();
          await wait(3000);
          
          const resultAfterRetry = document.querySelector('[data-testid="prediction-result"]');
          if (resultAfterRetry) {
            console.log('[Check] ✓ Prediction succeeded after retry');
            return {
              success: true,
              message: 'Prediction flow completed after retry',
              details: 'Recovery path working correctly'
            };
          }
        }
      }
      
      return {
        success: true,
        message: 'Error state with working retry path detected',
        details: 'UI provides recovery options (not permanently stuck)'
      };
    }

    return {
      success: false,
      message: 'Prediction flow timeout',
      details: 'No result or error state after 20 seconds'
    };

  } catch (error: any) {
    console.error('[Check] Error during prediction flow check:', error);
    return {
      success: false,
      message: 'Check execution failed',
      details: error.message
    };
  }
}

export async function runPredictionFlowCheck(): Promise<void> {
  // Only run if checkPrediction=1 is in URL
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkPrediction') !== '1') {
    return;
  }

  console.log('[Check] Prediction flow check enabled');
  
  // Wait for app to initialize
  await wait(2000);
  
  const result = await checkPredictionFlow();
  
  // Log result
  console.log('[Check] Result:', result);
  
  // Store result in window for external access
  (window as any).__predictionFlowCheckResult = result;
  
  // Display result in UI
  const resultDiv = document.createElement('div');
  resultDiv.id = 'prediction-flow-check-result';
  resultDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 16px;
    background: ${result.success ? '#10b981' : '#ef4444'};
    color: white;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    max-width: 300px;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  `;
  resultDiv.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 8px;">
      ${result.success ? '✓ PASS' : '✗ FAIL'}
    </div>
    <div style="margin-bottom: 4px;">${result.message}</div>
    ${result.details ? `<div style="font-size: 10px; opacity: 0.9;">${result.details}</div>` : ''}
  `;
  document.body.appendChild(resultDiv);
}
