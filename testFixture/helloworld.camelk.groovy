from('timer:tick?period=3s')
	.setBody().constant('Hello world test')
	.to('log:info')
	