import { Router } from '../../framework/Http/Router';
import { redirect } from '../../framework/Http/HttpResponse';

const web = new Router();

// Define any redirects here
web.get('/favicon.ico', () => redirect('/favicon.png', 301));

// Define your web routes here
//web.get('/health', 'AppController@health');
web.get('/health', () => new Response("OK", { status: 200 }));

web.get('/', 'AppController@index');
web.get('/users', 'UserController@index');
web.get('/users/:id', 'UserController@show');
//router.get('/users', 'UserController@index');
//router.post('/users', 'UserController@store');
//router.get('/users/:id', 'UserController@show');
//router.put('/users/:id', 'UserController@update');
//router.delete('/users/:id', 'UserController@destroy');

export default web;