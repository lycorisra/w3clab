using System.Web;

namespace w3clab.ajaxHandler
{
    /// <summary>
    /// HttpHandlr 的摘要说明
    /// </summary>
    public class HttpHandlr : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            var files = context.Request.Files;
            string list=string.Empty;
            for (var i = 0; i < files.Count; i++)
            {
                var file = files[i];
                list += file.FileName + "\n";
            }
            context.Response.Write("上传完成，" + list);
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}