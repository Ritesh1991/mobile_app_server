һ����ԭ����Ŀ��Ŀ¼����Ӳ���ģ��
1�����jasmineģ�飺meteor add sanjo:jasmine������ģ�飩
2����Ӳ��Ա���ģ�飺meteor add velocity:html-reporter�����Ա���ģ�飩
3�����sinonģ�飺meteor add practicalmeteor:sinon ����������ģ�飩

������Ӳ��Դ���
1����ԭ��Ŀ��Ŀ¼�����jasmine����Ŀ¼
   jasmineĿ¼�ṹ��
	-test
		-jasmine
			-client
				-integration
				-unit
			-server
				-integration
				-unit
2��������Ҫ���Ե�ģ���Ŀ¼����Ӳ��Դ����ļ�
3��������֮��ִ��: VELOCITY_DEBUG=1 JASMINE_SERVER_UNIT=1 meteor ������Ŀ
   VELOCITY_DEBUG=1 �����ô�ӡ���Գ����������Ϣ
   JASMINE_SERVER_UNIT=1 �Ǵ򿪷���˵�Ԫ���ԡ� 
   jasmineһ����4������ģ�飺
	   JASMINE_SERVER_UNIT������˵�Ԫ���ԣ�
	   JASMINE_SERVER_INTEGRATION������˼��ɲ��ԣ�
	   JASMINE_CLIENT_UNIT���ͻ��˵�Ԫ���ԣ�
	   JASMINE_CLIENT_INTEGRATION���ͻ��˼��ɲ��ԣ�
   һ�����ĸ�ģ�鶼��Ĭ�ϴ򿪵ġ����û�д򿪿�ֱ�����û��������򿪼��ɡ�
