/** 3P imports **/
import {toast} from "react-toastify";

/** test function imports **/
import {authenticated, login, backendUrl, getLoanByStatus} from '../auth';


/***TODO:
 * logout() function - We should ideally split into testable chunks
 * Write better test description
 * Compare code and test to see validate
 */


/** test setup **/
const OLD_ENV = process.env;
jest.mock('react-toastify');

/** test clean up **/
afterEach(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV; // restore old env
});
beforeEach(() => {
    jest.resetModules(); // most important - it clears the cache
    process.env = {...OLD_ENV}; // make a copy
});


/**
 * supply common values to login related tests
 * @param mockResponse
 * @returns {{setSubmitting: *, mockSuccessResponse, nav: {push: *}, values: {password: string, email: string}, backendUrl: *, mockFetchPromise: Promise<{json: (function(): Promise<any>)}>}}
 */
function getLoginMockValues(mockResponse = {}) {

    /** login function params **/
    const values = {email: "kalpesh.singh@foo.com", password: "1234"};
    const setSubmitting = jest.fn((val) => val);
    const nav = {
        push: jest.fn()
    };
    const fetchParams = {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
    };

    /** mock login function response **/
    const mockSuccessResponse = mockResponse;
    const mockJsonPromise = Promise.resolve(mockSuccessResponse);
    const mockFetchPromise = Promise.resolve({
        json: () => mockJsonPromise
    });

    /** other dependent functions **/
    const backendUrl = jest.fn(() => {
        return process.env.REACT_APP_DEVELOPMENT_API;
    });

    /** localstorage spying **/
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);
    jest.spyOn(Storage.prototype, 'setItem');
    jest.spyOn(Storage.prototype, 'removeItem');

    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();

    return {
        values,
        setSubmitting,
        nav,
        fetchParams,
        mockFetchPromise,
        mockSuccessResponse,
        backendUrl
    }
}

/**
 * supply common values to getLoanStatus related tests
 * @param mockResponse
 * @returns {{fetchParams: {headers: {Authorization: string, "Content-Type": string}}, handleStateChange: *, mockFetchPromise: Promise<{json: (function(): Promise<any>)}>, status: string}}
 */
function getLoanStatusMockValues(mockResponse = {}) {

    /** getLoanStatus function params **/
    const mockJsonPromise = Promise.resolve(mockResponse);
    const mockFetchPromise = Promise.resolve({
        json: () => mockJsonPromise
    });
    const status = "1";
    const handleStateChange = jest.fn();

    /** localstorage spying **/
    jest.spyOn(Storage.prototype, 'getItem');
    jest.spyOn(Storage.prototype, 'setItem');

    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();

    /** fetch params **/
    const fetchParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    };

    return {
        mockFetchPromise,
        status,
        handleStateChange,
        fetchParams
    }
}


test('should return true for authenticated function', () => {

    /** mocks **/
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIxNTE2MjQwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.ervjmmR5MAjz-ZJpEO8nhQpptXclhoJJn1-iDMw6ULA';
    jest.spyOn(Storage.prototype, 'getItem');
    Storage.prototype.getItem = jest.fn(() => token);

    const mockDate = new Date(1516239020);
    const mockDateImplementation = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

    /** assertion of function **/
    expect(authenticated()).toBe(true);

    /** restore mock values **/
    mockDateImplementation.mockRestore();

});

test('should return false for authenticated function', () => {

    /** mocks **/
    jest.spyOn(Storage.prototype, 'getItem');
    Storage.prototype.getItem = jest.fn();

    /** assertion of function **/
    expect(authenticated()).toBe(false);

});

test('should successfully login', async () => {

    /** mocks **/
    const mockResponse = {success: true};
    const {values, setSubmitting, nav, backendUrl, fetchParams} = getLoginMockValues(mockResponse);

    await login(values, setSubmitting, nav);

    /** assertion of fetch module **/
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`${backendUrl()}/login`, fetchParams);

    /** assertion of nav module **/
    expect(nav.push).toHaveBeenCalledTimes(1);
    expect(nav.push).toHaveBeenCalledWith('/home');

    /** assertion of toast module **/
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('Login Successful');
    expect(toast.success.mock.calls[0].length).toBe(1);

    /** assertion of callback **/
    expect(setSubmitting).toHaveBeenCalledTimes(1);
    expect(setSubmitting.mock.calls[0].length).toBe(1);
    expect(setSubmitting).toHaveBeenCalledWith(false);
});

test('should successfully login with error', async () => {

    /** mocks **/
    const mockResponse = {
        success: false,
        msg: "You need to be admin to access this area."
    };
    const {values, setSubmitting, nav, mockSuccessResponse, backendUrl, fetchParams} = getLoginMockValues(mockResponse);


    await login(values, setSubmitting, nav);

    /** assertion of fetch module **/
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`${backendUrl()}/login`, fetchParams);

    /** assertion of toast module **/
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(`Error: ${mockSuccessResponse.msg}`, {position: toast.POSITION.BOTTOM_CENTER});
    expect(toast.error.mock.calls[0].length).toBe(2);

    /** assertion of callback **/
    expect(setSubmitting).toHaveBeenCalledTimes(1);
    expect(setSubmitting.mock.calls[0].length).toBe(1);
    expect(setSubmitting).toHaveBeenCalledWith(false);
});

test('should fail login', async () => {

    /** mocks **/
    const mockFailureResponse = Promise.reject();
    const {values, setSubmitting, nav} = getLoginMockValues();
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFailureResponse);

    await login(values, setSubmitting, nav);

    /** assertion of toast module **/
    expect(toast).toHaveBeenCalledTimes(1);

    /** assertion of callback **/
    expect(setSubmitting).toHaveBeenCalledTimes(1);
    expect(setSubmitting.mock.calls[0].length).toBe(1);
    expect(setSubmitting).toHaveBeenCalledWith(false);


});

test('should return local development url', () => {
    expect(backendUrl()).toBe(process.env.REACT_APP_DEVELOPMENT_API);
});


test('should return production development url', () => {
    process.env.NODE_ENV = 'production';
    expect(backendUrl()).toBe(process.env.REACT_APP_PRODUCTION_API);
});


test('should get load status', async () => {

    /** mocks **/
    const mockSuccessResponse = {success: true, token: 'abc', data: {}};
    const {mockFetchPromise, status, handleStateChange, fetchParams} = getLoanStatusMockValues(mockSuccessResponse);
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);


    await getLoanByStatus(status, handleStateChange);

    /** assertion of fetch module **/
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`${backendUrl()}/loan/show?status=${status}&user_id=${localStorage.getItem('user_id')}`, fetchParams);

    /** assertion of callback **/
    expect(handleStateChange).toHaveBeenCalledTimes(1);
    expect(handleStateChange).toHaveBeenCalledWith(status, mockSuccessResponse.data);
    expect(handleStateChange.mock.calls[0].length).toBe(2);

});

test('should get load status with error', async () => {

    /** mocks **/
    const mockSuccessResponse = {
        success: false,
        token: 'abc',
        data: {},
        msg: "You need to be admin to access this area."
    };
    const {mockFetchPromise, status, handleStateChange, fetchParams} = getLoanStatusMockValues(mockSuccessResponse);
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFetchPromise);


    await getLoanByStatus(status, handleStateChange);

    /** assertion of fetch module **/
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(`${backendUrl()}/loan/show?status=${status}&user_id=${localStorage.getItem('user_id')}`, fetchParams);

    /** assertion of toast module **/
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith(JSON.stringify(`${mockSuccessResponse.msg}`), {position: toast.POSITION.BOTTOM_CENTER});
    expect(toast.info.mock.calls[0].length).toBe(2);

});

test('should get load status fail', async () => {

    /** mocks **/
    const mockFailureResponse = Promise.reject();
    jest.spyOn(global, 'fetch').mockImplementation(() => mockFailureResponse);

    const {status, handleStateChange} = getLoanStatusMockValues();

    await getLoanByStatus(status, handleStateChange);

    /** assertion of toast module **/
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(toast.info).toHaveBeenCalledWith('Error something went wrong, check your internet status', {position: toast.POSITION.BOTTOM_CENTER});
    expect(toast.info.mock.calls[0].length).toBe(2);

});
