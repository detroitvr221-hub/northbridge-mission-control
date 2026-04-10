/**
 * @jest-environment node
 */
const mod = require('../helpers/extracted-functions');
const { getGatewayUrl, setGatewayUrl, getState, setState, resetState, _localStorage } = mod;

beforeEach(() => {
  resetState();
  // In node env, window doesn't exist by default. Set up a mock.
  global.window = {
    location: {
      search: '',
      hostname: 'example.com',
      protocol: 'https:',
      pathname: '/',
      hash: ''
    },
    history: { replaceState: jest.fn() }
  };
});

afterEach(() => {
  delete global.window;
});

describe('getGatewayUrl', () => {
  test('returns null when nothing is configured and not local', () => {
    setState({ gatewayUrl: null });
    expect(getGatewayUrl()).toBeNull();
  });

  test('returns STATE.gatewayUrl when set', () => {
    setState({ gatewayUrl: 'http://my-gateway:8080' });
    expect(getGatewayUrl()).toBe('http://my-gateway:8080');
  });

  test('returns URL from localStorage when state is empty', () => {
    _localStorage.setItem('mc_gateway_url', 'http://stored-gateway:9090');
    expect(getGatewayUrl()).toBe('http://stored-gateway:9090');
  });

  test('returns localhost fallback for local development', () => {
    global.window.location.hostname = 'localhost';
    expect(getGatewayUrl()).toBe('http://localhost:18789');
  });

  test('returns localhost fallback for 127.0.0.1', () => {
    global.window.location.hostname = '127.0.0.1';
    expect(getGatewayUrl()).toBe('http://localhost:18789');
  });

  test('returns localhost fallback for file: protocol', () => {
    global.window.location.hostname = '';
    global.window.location.protocol = 'file:';
    expect(getGatewayUrl()).toBe('http://localhost:18789');
  });

  test('query param takes highest priority', () => {
    global.window.location.search = '?gateway=http://from-query:5555';
    setState({ gatewayUrl: 'http://from-state:1111' });
    _localStorage.setItem('mc_gateway_url', 'http://from-storage:2222');
    expect(getGatewayUrl()).toBe('http://from-query:5555');
  });

  test('STATE takes priority over localStorage', () => {
    setState({ gatewayUrl: 'http://from-state:1111' });
    _localStorage.setItem('mc_gateway_url', 'http://from-storage:2222');
    expect(getGatewayUrl()).toBe('http://from-state:1111');
  });
});

describe('setGatewayUrl', () => {
  test('stores URL in state and localStorage', () => {
    setGatewayUrl('http://new-gateway:1234');
    expect(getState().gatewayUrl).toBe('http://new-gateway:1234');
    expect(_localStorage.getItem('mc_gateway_url')).toBe('http://new-gateway:1234');
  });

  test('clears localStorage when url is null', () => {
    _localStorage.setItem('mc_gateway_url', 'http://old');
    setGatewayUrl(null);
    expect(getState().gatewayUrl).toBeNull();
    expect(_localStorage.getItem('mc_gateway_url')).toBeNull();
  });
});
