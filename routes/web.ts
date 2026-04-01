import { Router } from '../framework/Http/Router';

const web = new Router();
web.get('/health', 'AppController@health');
web.get('/', 'AppController@index');
web.get('/users/:id', 'UserController@show');
//router.get('/users', 'UserController@index');
//router.post('/users', 'UserController@store');
//router.get('/users/:id', 'UserController@show');
//router.put('/users/:id', 'UserController@update');
//router.delete('/users/:id', 'UserController@destroy');

export default web;