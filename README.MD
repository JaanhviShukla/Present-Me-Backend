 #Backend

 Routes 
  1=> Students
     -studAuth
     -/students/signup
     -/students/signin
     -/students/logout
     -/students/prfile
     -/students/change-password


  2=> Teachers 
     -teacherAuth
     -/teachers/signup
     -/teachers/login
     -/teachers/logout
     -/teachers/change-password
     -/teachers/profile



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