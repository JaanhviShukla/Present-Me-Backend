 #Backend

 Routes 
  1=> Students
     -studAuth
     -/students/signup
     -/students/signin
     -/students/logout
     -/students/prfile
     -/students/change-password
     -/students/joinRequests


  2=> Teachers 
     -teacherAuth
     -/teachers/signup
     -/teachers/login
     -/teachers/logout
     -/teachers/change-password

     -/teachers/profile

     -/teachers/class                              POST -> to create the class
     -/teachers/class/:classCode                   DELETE -> to delete the class
     -/teachers/class/:classCode                   PATCH -> edit the class name
     -/teachers/class                              GET -> get all class of login teacher




  3=> Admin
     -instituteAuth
     -/admin/signup
     -/admin/login
     -/admin/logout
     -/admin/dashboard
     -admin/change-password



  4=> SuperAdmin
    -SAuth
    -/sadmin/login
    -/sadmin/institutes                                          -> to get list of institute
    -/sadmin/institutes/:institutionId/status

   5=> services
      - addJoinRequest   ->function is created
