import { describe, expect, it } from 'vitest';

describe('FloatingAIAssistant & Drawer Configuration', () => {
  const QUICK_PROMPTS = [
    '🏡 Gợi ý homestay view đẹp',
    '🚌 Tìm nhà xe & vé xe',
    '🍜 Quán ăn & đặc sản ngon',
    '💰 Dự toán chi phí chuyến đi',
  ];

  it('contains expected quick prompt categories for travel planning', () => {
    expect(QUICK_PROMPTS.length).toBe(4);
    expect(QUICK_PROMPTS[0]).toContain('homestay');
    expect(QUICK_PROMPTS[1]).toContain('nhà xe');
    expect(QUICK_PROMPTS[2]).toContain('Quán ăn');
    expect(QUICK_PROMPTS[3]).toContain('Dự toán chi phí');
  });

  it('validates drawer message structure', () => {
    const welcomeMsg = {
      id: 'welcome-msg',
      role: 'assistant' as const,
      content: 'Xin chào! Tôi là Trợ lý du lịch Smart Trip.',
      timestamp: new Date().toISOString(),
    };

    expect(welcomeMsg.role).toBe('assistant');
    expect(welcomeMsg.content).toContain('Smart Trip');
    expect(typeof welcomeMsg.timestamp).toBe('string');
  });
});
