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
     -/students/ViewJoinRequest
     -/students/enrolledClasses   (students can see the classes in which it is enrolled)


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
     -/teachers/class   GET -> get all class of login teacher
     
     -/teachers/approve-student   (teacher approved student, student go from joinRequest array to students array)    





  3=> Admin
     -instituteAuth
     -/admin/signup
     -/admin/login
     -/admin/logout
     -/admin/dashboard
     -admin/change-password

     -admin/profile  (patch api to update profile)



  4=> SuperAdmin
    -SAuth
    -/sadmin/login
    -/sadmin/institutes                                          -> to get list of institute
    -/sadmin/institutes/:institutionId/status
    -/sadmin/verifiedInstitutes
    -/sadmin/pendingInstitutes

   5=> services
      - addJoinRequest   ->function is created
