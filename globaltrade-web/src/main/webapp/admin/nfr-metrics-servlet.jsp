<%@ page contentType="text/html;charset=UTF-8" language="java" isELIgnored="false" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Redirecting to NFR Metrics...</title>
</head>
<body>
<%
    response.sendRedirect(request.getContextPath() + "/admin/nfr-metrics.jsp");
%>
</body>
</html>
