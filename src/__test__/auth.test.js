import {authenticated, login, backendUrl, getLoanByStatus} from '../auth';
import {toast} from "react-toastify";


/***TODO:
 * logout() function - We should ideally split into testable chunks
 * backendUrl() function - Need to see how can we override variable in this file to test production environment case
 * Write better test description
 * Add comments
 *
 */

jest.mock('react-toastify');

afterEach(() => {
    jest.clearAllMocks()
});

test('should return true for authenticated function', () => {

    jest.spyOn(Storage.prototype, 'getItem');

    Storage.prototype.getItem = jest.fn(() => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNTE2MjQwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.ervjmmR5MAjz-ZJpEO8nhQpptXclhoJJn1-iDMw6ULA');

    const mockDate = new Date(1516239020);
    const mockDateImplementation = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    expect(authenticated()).toBe(true);

    mockDateImplementation.mockRestore();

});

test('should successfully login', async () => {

    const values = {email: "kalpesh.singh@foo.com", password: "1234"};

    const setSubmitting = jest.fn((val) => val);

    const nav = {
        push: jest.fn()
    };

    const mockSuccessResponse = {success: true};
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
        json: () => mockJsonPromise
    });


    const backendUrl = jest.fn(() => {
        return process.env.REACT_APP_DEVELOPMENT_API;
    });

    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'removeItem');

    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();


    await login(values, setSubmitting, nav);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`${backendUrl()}/login`, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
    });

    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith('/home');

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Login Successful');

    expect(setSubmitting).toHaveBeenCalledTimes(1);
});

test('should return local development url', () => {
    expect(backendUrl()).toBe(process.env.REACT_APP_DEVELOPMENT_API);
});

test('should get load status', async () => {
    const mockSuccessResponse = {success: true, token: 'abc', data: {}};
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
        json: () => mockJsonPromise
    });
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);

    jest.spyOn(Storage.prototype, 'getItem');
    jest.spyOn(Storage.prototype, 'setItem');

    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();


    const status = "1";
    const handleStateChange = jest.fn();

    await getLoanByStatus(status, handleStateChange);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`${backendUrl()}/loan/show?status=${status}&user_id=${localStorage.getItem('user_id')}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith(status, mockSuccessResponse.data);
    expect(handleStateChange.mock.calls[0].length).toBe(2);

});
